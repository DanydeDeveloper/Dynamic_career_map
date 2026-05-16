import type { FeedbackSignal } from "@/types/domain";

export type RuleProposal = {
  proposalType:
    | "update_profile"
    | "update_visibility"
    | "update_interest"
    | "adjust_formats"
    | "update_activity_format"
    | "add_event"
    | "remove_event"
    | "change_priority"
    | "change_event_priority"
    | "update_strategy";
  description: string;
  oldValue?: string;
  newValue?: string;
  reason: string;
};

export function buildRuleBasedProposals(signal: FeedbackSignal): RuleProposal[] {
  const mainArea = signal.eventAreas[0] ?? "выбранной области";
  const proposals: RuleProposal[] = [];

  if (signal.interestScore >= 8 && signal.engagementScore >= 7 && signal.wantContinue === "yes") {
    proposals.push({
      proposalType: "update_profile",
      description: `Повысить интерес к области ${mainArea}`,
      oldValue: "Текущий интерес без учета последнего мероприятия",
      newValue: "Увеличить оценку интереса на 1 пункт после подтверждения педагога",
      reason:
        "Ребенок высоко оценил интерес и вовлеченность, а также хочет продолжать похожие активности. Влияние остается умеренным, потому что одно событие не должно резко менять траекторию."
    });

    proposals.push({
      proposalType: "update_visibility",
      description: `Зафиксировать рост насмотренности в области ${mainArea}`,
      oldValue: "Насмотренность до посещения мероприятия",
      newValue: "Добавить баллы насмотренности после подтвержденной обратной связи",
      reason:
        "Мероприятие стало новой подтвержденной пробой. Насмотренность растет отдельно от интереса и должна отражать накопленный опыт."
    });

    proposals.push({
      proposalType: "add_event",
      description: `Добавить похожее мероприятие по области ${mainArea}`,
      reason: "Положительная рефлексия дает основание проверить интерес повторной пробой в похожем, но не идентичном формате."
    });
  }

  if (signal.interestScore <= 4 && signal.wantContinue === "no") {
    proposals.push({
      proposalType: "change_event_priority",
      description: `Снизить приоритет текущего формата в области ${mainArea}`,
      oldValue: signal.eventFormats.join(", "),
      newValue: "Предложить альтернативный формат в той же области",
      reason:
        "Низкий интерес к мероприятию не означает отказ от области. Сначала стоит проверить другой формат: практический, проектный или экскурсионный."
    });
  }

  if (signal.fatigueScore >= 8) {
    proposals.push({
      proposalType: "update_strategy",
      description: "Скорректировать нагрузку в ближайшей карте мероприятий",
      oldValue: "Текущий темп мероприятий",
      newValue: "Снизить плотность событий или выбирать более короткие форматы",
      reason: "Высокая усталость может исказить оценку интереса, поэтому стратегию стоит корректировать аккуратно."
    });
  }

  return proposals;
}
