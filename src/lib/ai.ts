import { buildRuleBasedProposals, type RuleProposal } from "@/lib/profile-rules";
import type { FeedbackSignal } from "@/types/domain";

const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const DEFAULT_MODEL = "claude-sonnet-4-6";

export type GeneratedStrategyInput = {
  studentName: string;
  age?: number;
  grade?: string;
  city?: string;
  interests: Record<string, number>;
  inclinations?: Record<string, number>;
  activityFormats?: Record<string, number>;
  stability?: Record<string, string>;
  visibility: Record<string, number>;
  parentExpectations?: string | null;
  likedActivities?: string | null;
  subjects?: string | null;
  experience?: string | null;
};

export type GeneratedStrategyDraft = {
  strategySummary: string;
  mainHypotheses: string[];
  areasToExpand: string[];
  areasToCheck: string[];
  recommendedFormats: string[];
  risks: string[];
  next3MonthsFocus: string;
  next12MonthsFocus: string;
};

export type GeneratedDiagnosticInsights = {
  profileSummary: string;
  curatorComment: string;
  strategy: GeneratedStrategyDraft;
  source: "ai" | "fallback";
};

type AnthropicMessageResponse = {
  content?: Array<
    | {
        type: "text";
        text: string;
      }
    | {
        type: "tool_use";
        id: string;
        name: string;
        input: unknown;
      }
  >;
};

const strategySchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "profileSummary",
    "curatorComment",
    "strategySummary",
    "mainHypotheses",
    "areasToExpand",
    "areasToCheck",
    "recommendedFormats",
    "risks",
    "next3MonthsFocus",
    "next12MonthsFocus"
  ],
  properties: {
    profileSummary: { type: "string" },
    curatorComment: { type: "string" },
    strategySummary: { type: "string" },
    mainHypotheses: { type: "array", items: { type: "string" } },
    areasToExpand: { type: "array", items: { type: "string" } },
    areasToCheck: { type: "array", items: { type: "string" } },
    recommendedFormats: { type: "array", items: { type: "string" } },
    risks: { type: "array", items: { type: "string" } },
    next3MonthsFocus: { type: "string" },
    next12MonthsFocus: { type: "string" }
  }
};

const proposalsSchema = {
  type: "object",
  additionalProperties: false,
  required: ["proposals"],
  properties: {
    proposals: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["proposalType", "description", "oldValue", "newValue", "reason"],
        properties: {
          proposalType: {
            type: "string",
            enum: [
              "update_profile",
              "update_visibility",
              "update_interest",
              "adjust_formats",
              "update_activity_format",
              "update_strategy",
              "add_event",
              "remove_event",
              "change_priority",
              "change_event_priority"
            ]
          },
          description: { type: "string" },
          oldValue: { type: "string" },
          newValue: { type: "string" },
          reason: { type: "string" }
        }
      }
    }
  }
};

const aiInsightSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "summary", "evidence", "recommendations", "risks", "nextQuestions"],
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    evidence: { type: "array", items: { type: "string" } },
    recommendations: { type: "array", items: { type: "string" } },
    risks: { type: "array", items: { type: "string" } },
    nextQuestions: { type: "array", items: { type: "string" } }
  }
};

function anthropicModel() {
  return process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
}

function anthropicApiKey() {
  return process.env.ANTHROPIC_API_KEY?.trim() || process.env.CLAUDE_API_KEY?.trim() || "";
}

function hasAnthropicKey() {
  return Boolean(anthropicApiKey());
}

function buildStructuredToolRequest(name: string, schema: object, instructions: string, input: unknown) {
  return {
    model: anthropicModel(),
    max_tokens: 1800,
    system: instructions,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: [
              "Верни результат только через вызов инструмента emit_structured_result.",
              "Входные данные:",
              JSON.stringify(input)
            ].join("\n")
          }
        ]
      }
    ],
    tools: [
      {
        name: "emit_structured_result",
        description: `Return the validated ${name} JSON payload for the application.`,
        input_schema: schema,
        strict: true
      }
    ],
    tool_choice: {
      type: "tool",
      name: "emit_structured_result"
    }
  };
}

function extractToolInput(response: AnthropicMessageResponse) {
  const toolUse = response.content?.find(
    (content): content is Extract<NonNullable<AnthropicMessageResponse["content"]>[number], { type: "tool_use" }> =>
      content.type === "tool_use" && content.name === "emit_structured_result"
  );

  return toolUse?.input;
}

async function callClaudeStructured<T>(name: string, schema: object, instructions: string, input: unknown): Promise<T | null> {
  if (!hasAnthropicKey()) {
    return null;
  }

  try {
    const response = await fetch(ANTHROPIC_MESSAGES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": ANTHROPIC_VERSION,
        "x-api-key": anthropicApiKey()
      },
      body: JSON.stringify(buildStructuredToolRequest(name, schema, instructions, input)),
      cache: "no-store"
    });

    if (!response.ok) {
      console.warn(`Claude draft generation failed: ${response.status} ${await response.text()}`);
      return null;
    }

    const data = (await response.json()) as AnthropicMessageResponse;
    const toolInput = extractToolInput(data);
    return toolInput ? (toolInput as T) : null;
  } catch (error) {
    console.warn("Claude draft generation failed:", error);
    return null;
  }
}

function normalizeText(value: unknown, fallback: string, maxLength = 900) {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized.slice(0, maxLength) : fallback;
}

function normalizeStringList(value: unknown, fallback: string[], limit = 5) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const items = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, limit);

  return items.length > 0 ? items : fallback;
}

function allowedAreaKeys(input: GeneratedStrategyInput) {
  return new Set([...Object.keys(input.interests), ...Object.keys(input.visibility)]);
}

function normalizeAreaList(value: unknown, fallback: string[], input: GeneratedStrategyInput, limit = 5) {
  const allowed = allowedAreaKeys(input);
  const items = normalizeStringList(value, fallback, limit).filter((item) => allowed.has(item));
  return items.length > 0 ? items : fallback;
}

function normalizeStrategyDraft(value: unknown, fallback: GeneratedDiagnosticInsights, input: GeneratedStrategyInput) {
  if (!value || typeof value !== "object") {
    return fallback;
  }

  const draft = value as Record<string, unknown>;

  return {
    profileSummary: normalizeText(draft.profileSummary, fallback.profileSummary),
    curatorComment: normalizeText(draft.curatorComment, fallback.curatorComment),
    strategy: {
      strategySummary: normalizeText(draft.strategySummary, fallback.strategy.strategySummary),
      mainHypotheses: normalizeStringList(draft.mainHypotheses, fallback.strategy.mainHypotheses, 4),
      areasToExpand: normalizeAreaList(draft.areasToExpand, fallback.strategy.areasToExpand, input, 5),
      areasToCheck: normalizeAreaList(draft.areasToCheck, fallback.strategy.areasToCheck, input, 5),
      recommendedFormats: normalizeStringList(draft.recommendedFormats, fallback.strategy.recommendedFormats, 5),
      risks: normalizeStringList(draft.risks, fallback.strategy.risks, 5),
      next3MonthsFocus: normalizeText(draft.next3MonthsFocus, fallback.strategy.next3MonthsFocus),
      next12MonthsFocus: normalizeText(draft.next12MonthsFocus, fallback.strategy.next12MonthsFocus)
    },
    source: "ai" as const
  };
}

function fallbackInsights(input: GeneratedStrategyInput): GeneratedDiagnosticInsights {
  const topInterest = Object.entries(input.interests).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "интересная область";
  const topAreas = Object.entries(input.interests)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([area]) => area);
  const lowVisibility = Object.entries(input.visibility)
    .filter(([, score]) => score <= 30)
    .map(([area]) => area)
    .slice(0, 3);

  return {
    profileSummary: `По диагностике у ученика выделяются направления: ${topAreas.join(", ")}. Важно проверять интересы через разные форматы и не сужать траекторию после одной пробы.`,
    curatorComment: `Любимые занятия: ${input.likedActivities || "не указано"}. Предметы: ${input.subjects || "не указано"}. Опыт: ${input.experience || "не указан"}.`,
    strategy: {
      strategySummary: `${input.studentName}: сохранить ${topInterest} как сильную линию интереса, но не сужать траекторию до одной области.`,
      mainHypotheses: [
        "Интерес нужно проверять через разные форматы",
        "Насмотренность и интерес считаются отдельно",
        "После одного события профиль меняется только мягко"
      ],
      areasToExpand: lowVisibility,
      areasToCheck: lowVisibility,
      recommendedFormats: ["workshop", "project_school", "excursion"],
      risks: ["Преждевременное сужение траектории", "Переоценка одного успешного или неудачного события"],
      next3MonthsFocus: "Провести 2-3 разные профпробы и собрать обратную связь по интересу, вовлеченности и усталости.",
      next12MonthsFocus: "Собрать сбалансированную карту из технических, научных, творческих и социальных проб."
    },
    source: "fallback"
  };
}

export async function generateDiagnosticInsightsDraft(input: GeneratedStrategyInput): Promise<GeneratedDiagnosticInsights> {
  const fallback = fallbackInsights(input);
  const aiDraft = await callClaudeStructured<Record<string, unknown>>(
    "career_diagnostic_insights",
    strategySchema,
    [
      "Ты помогаешь педагогу Private.Education вести профориентационную карту школьника 5-7 класса.",
      "Сформируй черновик характеристики и стратегии на русском языке.",
      "Не ставь диагнозов, не делай окончательных выводов и не обещай результат.",
      "Пиши как педагогический черновик: конкретно, осторожно, пригодно для согласования.",
      "В areasToExpand и areasToCheck используй только ключи областей, которые есть во входных interests или visibility.",
      "recommendedFormats возвращай короткими ключами форматов или понятными названиями форматов."
    ].join(" "),
    input
  );

  return normalizeStrategyDraft(aiDraft, fallback, input);
}

export async function generateCareerStrategyDraft(input: GeneratedStrategyInput) {
  const insights = await generateDiagnosticInsightsDraft(input);
  return insights.strategy;
}

function normalizeProposal(value: unknown): RuleProposal | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const proposal = value as Record<string, unknown>;
  const proposalType = proposal.proposalType;

  if (
    proposalType !== "update_profile" &&
    proposalType !== "update_visibility" &&
    proposalType !== "update_interest" &&
    proposalType !== "adjust_formats" &&
    proposalType !== "update_activity_format" &&
    proposalType !== "update_strategy" &&
    proposalType !== "add_event" &&
    proposalType !== "remove_event" &&
    proposalType !== "change_priority" &&
    proposalType !== "change_event_priority"
  ) {
    return null;
  }

  return {
    proposalType,
    description: normalizeText(proposal.description, "Предложение изменения", 240),
    oldValue: normalizeText(proposal.oldValue, "Текущее состояние", 400),
    newValue: normalizeText(proposal.newValue, "Предлагаемое изменение", 600),
    reason: `AI-черновик. ${normalizeText(proposal.reason, "Требуется проверка педагогом перед применением.", 800)}`
  };
}

function normalizeProposals(value: unknown) {
  if (!value || typeof value !== "object") {
    return [];
  }

  const proposals = (value as { proposals?: unknown }).proposals;

  if (!Array.isArray(proposals)) {
    return [];
  }

  return proposals.map(normalizeProposal).filter((proposal): proposal is RuleProposal => Boolean(proposal)).slice(0, 4);
}

export type GeneratedAiInsight = {
  title: string;
  summary: string;
  evidence: string[];
  recommendations: string[];
  risks: string[];
  nextQuestions: string[];
  source: "ai" | "fallback";
};

export type FeedbackAnalysisInput = FeedbackSignal & {
  currentProfile?: unknown;
  currentStrategy?: unknown;
  currentEventMap?: unknown;
  currentVisibility?: unknown;
  proposalsCreated?: number;
};

export type SnapshotComparisonInput = {
  studentName: string;
  reason: string;
  before: unknown;
  after: unknown;
  context?: unknown;
};

function normalizeAiInsight(value: unknown, fallback: GeneratedAiInsight) {
  if (!value || typeof value !== "object") {
    return fallback;
  }

  const insight = value as Record<string, unknown>;

  return {
    title: normalizeText(insight.title, fallback.title, 140),
    summary: normalizeText(insight.summary, fallback.summary, 1200),
    evidence: normalizeStringList(insight.evidence, fallback.evidence, 6),
    recommendations: normalizeStringList(insight.recommendations, fallback.recommendations, 6),
    risks: normalizeStringList(insight.risks, fallback.risks, 5),
    nextQuestions: normalizeStringList(insight.nextQuestions, fallback.nextQuestions, 5),
    source: "ai" as const
  };
}

function fallbackFeedbackAnalysis(input: FeedbackAnalysisInput): GeneratedAiInsight {
  const eventTitle = input.eventTitle ?? "Мероприятие";
  const difficultyScore = input.difficultyScore ?? 5;
  const positiveSignals = [
    input.interestScore >= 7 ? `Интерес высокий: ${input.interestScore}/10` : null,
    input.engagementScore >= 7 ? `Вовлеченность высокая: ${input.engagementScore}/10` : null,
    input.wantContinue === "yes" ? "Ученик хочет продолжать направление" : null,
    input.liked ? `Понравилось: ${input.liked}` : null
  ].filter(Boolean) as string[];
  const cautionSignals = [
    difficultyScore >= 8 ? `Сложность высокая: ${difficultyScore}/10` : null,
    input.fatigueScore >= 8 ? `Усталость высокая: ${input.fatigueScore}/10` : null,
    input.wantContinue === "no" ? "Ученик не хочет продолжать в текущем формате" : null,
    input.disliked ? `Не понравилось: ${input.disliked}` : null
  ].filter(Boolean) as string[];

  return {
    title: "Разбор обратной связи",
    summary: `${eventTitle}: интерес ${input.interestScore}/10, вовлеченность ${input.engagementScore}/10, сложность ${difficultyScore}/10, усталость ${input.fatigueScore}/10. Сигнал стоит рассматривать как повод уточнить траекторию, а не как окончательный вывод.`,
    evidence: [...positiveSignals, ...cautionSignals].slice(0, 6),
    recommendations: [
      input.wantContinue === "yes" ? "Сохранить направление в ближайших гипотезах и проверить его еще одним форматом." : "Проверить, проблема была в направлении или в формате мероприятия.",
      input.fatigueScore >= 8 ? "Снизить плотность похожих событий и обсудить комфортную нагрузку." : "Собрать еще одну обратную связь после следующей профпробы.",
      input.proposalsCreated ? `Проверить ${input.proposalsCreated} черновик(а) предложений перед согласованием.` : "Не менять профиль резко без дополнительного наблюдения."
    ],
    risks: cautionSignals.length > 0 ? cautionSignals : ["Недостаточно данных для сильного вывода по одному мероприятию."],
    nextQuestions: [
      "Что именно удерживало интерес во время мероприятия?",
      "Какая часть была сложной: тема, темп, формат или коммуникация?",
      "Хочется ли повторить похожий опыт в другом формате?"
    ],
    source: "fallback"
  };
}

function fallbackSnapshotComparison(input: SnapshotComparisonInput): GeneratedAiInsight {
  return {
    title: "Динамика траектории",
    summary: `${input.studentName}: состояние траектории обновлено. Сравнение снимков фиксирует, что изменения уже сохранены в журнале, но педагогический вывод требует проверки на следующих действиях.`,
    evidence: [input.reason, "Есть снимок состояния до изменения.", "Есть снимок состояния после изменения."],
    recommendations: [
      "Смотреть не только на текущий профиль, но и на динамику после диагностик и обратной связи.",
      "Проверить, подтверждается ли изменение следующим мероприятием или разговором.",
      "Использовать вывод как черновик для обсуждения с педагогом."
    ],
    risks: ["Один шаг траектории не должен резко менять долгосрочную стратегию."],
    nextQuestions: [
      "Что именно изменилось в интересах, карте или стратегии?",
      "Какая следующая профпроба лучше всего проверит новую гипотезу?",
      "Нужно ли объяснить изменение родителю или ученику?"
    ],
    source: "fallback"
  };
}

export async function generateFeedbackAnalysis(input: FeedbackAnalysisInput): Promise<GeneratedAiInsight> {
  const fallback = fallbackFeedbackAnalysis(input);
  const aiDraft = await callClaudeStructured<Record<string, unknown>>(
    "career_feedback_analysis",
    aiInsightSchema,
    [
      "Ты помогаешь педагогу Private.Education разобрать обратную связь ученика после профориентационного мероприятия.",
      "Верни педагогический AI-черновик на русском языке: что сигналит опыт, какие есть доказательства, что делать дальше, где риски и какие вопросы задать.",
      "Не применяй изменения сам, не делай окончательных выводов по одному событию, не ставь диагнозы.",
      "Пиши конкретно и в рамках архитектуры: обратная связь может породить change proposal, но применяет его только педагог."
    ].join(" "),
    input
  );

  return normalizeAiInsight(aiDraft, fallback);
}

export async function generateSnapshotComparison(input: SnapshotComparisonInput): Promise<GeneratedAiInsight> {
  const fallback = fallbackSnapshotComparison(input);
  const aiDraft = await callClaudeStructured<Record<string, unknown>>(
    "career_snapshot_comparison",
    aiInsightSchema,
    [
      "Ты помогаешь педагогу Private.Education сравнить снимки состояния карьерной карты ученика до и после важного действия.",
      "Сравни профиль, стратегию, карту мероприятий и насмотренность только как педагогический черновик.",
      "Назови, что изменилось, на какие доказательства смотреть, что проверить дальше, какие риски есть.",
      "Не предлагай применять изменения напрямую: все изменения идут через согласование педагога."
    ].join(" "),
    input
  );

  return normalizeAiInsight(aiDraft, fallback);
}

export async function generateFeedbackProposals(signal: FeedbackSignal) {
  const fallback = buildRuleBasedProposals(signal);
  const aiDraft = await callClaudeStructured<{ proposals: unknown[] }>(
    "career_feedback_proposals",
    proposalsSchema,
    [
      "Ты помогаешь педагогу Private.Education разобрать обратную связь после мероприятия школьника 5-7 класса.",
      "Сформируй 0-4 осторожных предложения изменений, которые педагог должен согласовать перед применением.",
      "Не применяй изменения сам. Не делай резких выводов по одному событию.",
      "Если interestScore >= 8, engagementScore >= 7 и wantContinue = yes, верни минимум 2 предложения: мягкое обновление профиля и рост насмотренности.",
      "Если fatigueScore >= 8, предложи корректировку нагрузки или стратегии.",
      "Если interestScore <= 4 и wantContinue = no, предложи сменить формат, а не исключать область.",
      "Если данных мало или событие нейтральное, верни пустой список.",
      "proposalType выбирай только из поддержанного enum. reason объясняет педагогическую логику."
    ].join(" "),
    signal
  );
  const aiProposals = normalizeProposals(aiDraft);

  if (aiProposals.length > 0) {
    return aiProposals;
  }

  return fallback.map((proposal) => ({
    ...proposal,
    reason: `Системный черновик. ${proposal.reason}`
  }));
}
