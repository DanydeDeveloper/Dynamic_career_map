import { buildRuleBasedProposals, type RuleProposal } from "@/lib/profile-rules";
import type { FeedbackSignal } from "@/types/domain";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-5.4-mini";

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

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
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

function openAiModel() {
  return process.env.OPENAI_MODEL || DEFAULT_MODEL;
}

function hasOpenAiKey() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

function buildJsonRequest(name: string, schema: object, instructions: string, input: unknown) {
  return {
    model: openAiModel(),
    instructions,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: JSON.stringify(input)
          }
        ]
      }
    ],
    max_output_tokens: 1800,
    text: {
      format: {
        type: "json_schema",
        name,
        strict: true,
        schema
      },
      verbosity: "medium"
    }
  };
}

function extractOutputText(response: OpenAIResponse) {
  if (response.output_text) {
    return response.output_text;
  }

  return (
    response.output
      ?.flatMap((item) => item.content ?? [])
      .find((content) => content.type === "output_text" && content.text)
      ?.text ?? ""
  );
}

async function callOpenAiJson<T>(name: string, schema: object, instructions: string, input: unknown): Promise<T | null> {
  if (!hasOpenAiKey()) {
    return null;
  }

  try {
    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify(buildJsonRequest(name, schema, instructions, input)),
      cache: "no-store"
    });

    if (!response.ok) {
      console.warn(`OpenAI draft generation failed: ${response.status} ${await response.text()}`);
      return null;
    }

    const data = (await response.json()) as OpenAIResponse;
    const outputText = extractOutputText(data);
    return outputText ? (JSON.parse(outputText) as T) : null;
  } catch (error) {
    console.warn("OpenAI draft generation failed:", error);
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
  const aiDraft = await callOpenAiJson<Record<string, unknown>>(
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

export async function generateFeedbackProposals(signal: FeedbackSignal) {
  const fallback = buildRuleBasedProposals(signal);
  const aiDraft = await callOpenAiJson<{ proposals: unknown[] }>(
    "career_feedback_proposals",
    proposalsSchema,
    [
      "Ты помогаешь педагогу Private.Education разобрать обратную связь после мероприятия школьника 5-7 класса.",
      "Сформируй 0-4 осторожных предложения изменений, которые педагог должен согласовать перед применением.",
      "Не применяй изменения сам. Не делай резких выводов по одному событию.",
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
