import { buildRuleBasedProposals } from "@/lib/profile-rules";
import type { FeedbackSignal } from "@/types/domain";

export type GeneratedStrategyInput = {
  studentName: string;
  interests: Record<string, number>;
  visibility: Record<string, number>;
  parentExpectations?: string | null;
};

export async function generateCareerStrategyDraft(input: GeneratedStrategyInput) {
  if (!process.env.OPENAI_API_KEY) {
    return buildFallbackStrategy(input);
  }

  // Real AI integration will live here. The app keeps this boundary small so AI output
  // can be reviewed and stored as a draft instead of being applied automatically.
  return buildFallbackStrategy(input);
}

export async function generateFeedbackProposals(signal: FeedbackSignal) {
  return buildRuleBasedProposals(signal);
}

function buildFallbackStrategy(input: GeneratedStrategyInput) {
  const topInterest = Object.entries(input.interests).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "интересная область";
  const lowVisibility = Object.entries(input.visibility)
    .filter(([, score]) => score <= 30)
    .map(([area]) => area)
    .slice(0, 3);

  return {
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
  };
}
