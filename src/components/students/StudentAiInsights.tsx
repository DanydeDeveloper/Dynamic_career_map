import { BrainCircuit, GitCompareArrows, MessageSquareText, Sparkles } from "lucide-react";
import { parseJson } from "@/lib/format";

type StudentAiInsight = {
  id: string;
  insightType: string;
  source: string;
  title: string;
  summary: string;
  evidenceJson: string;
  recommendationsJson: string;
  risksJson: string;
  nextQuestionsJson: string;
  relatedType: string | null;
  createdAt: Date;
  actor: { name: string | null; email: string } | null;
};

type StudentAiInsightsProps = {
  insights: StudentAiInsight[];
};

const typeLabels: Record<string, string> = {
  diagnostic_interpretation: "Диагностика",
  feedback_analysis: "Обратная связь",
  snapshot_comparison: "Динамика"
};

const sourceLabels: Record<string, string> = {
  claude: "Claude",
  rule_based: "Правила",
  diagnostic: "Диагностика"
};

const typeIcons = {
  diagnostic_interpretation: BrainCircuit,
  feedback_analysis: MessageSquareText,
  snapshot_comparison: GitCompareArrows
};

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(value);
}

function InsightList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="ai-insight-list">
      <strong>{title}</strong>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function StudentAiInsights({ insights }: StudentAiInsightsProps) {
  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">AI-анализ траектории</h2>
          <p className="panel-subtitle">Черновики для педагога: интерпретация диагностики, разбор опыта и сравнение версий.</p>
        </div>
        <Sparkles size={20} aria-hidden="true" />
      </div>
      <div className="panel-body">
        {insights.length > 0 ? (
          <div className="ai-insight-grid">
            {insights.map((insight) => {
              const Icon = typeIcons[insight.insightType as keyof typeof typeIcons] ?? BrainCircuit;
              const evidence = parseJson<string[]>(insight.evidenceJson, []);
              const recommendations = parseJson<string[]>(insight.recommendationsJson, []);
              const risks = parseJson<string[]>(insight.risksJson, []);
              const nextQuestions = parseJson<string[]>(insight.nextQuestionsJson, []);

              return (
                <article className="ai-insight-card" key={insight.id}>
                  <div className="ai-insight-top">
                    <Icon size={19} aria-hidden="true" />
                    <div>
                      <div className="timeline-details">
                        <span>{typeLabels[insight.insightType] ?? insight.insightType}</span>
                        <span>{sourceLabels[insight.source] ?? insight.source}</span>
                        <span>{formatDateTime(insight.createdAt)}</span>
                      </div>
                      <h3>{insight.title}</h3>
                    </div>
                  </div>
                  <p>{insight.summary}</p>
                  <div className="ai-insight-columns">
                    <InsightList title="Доказательства" items={evidence} />
                    <InsightList title="Что делать дальше" items={recommendations} />
                    <InsightList title="Риски" items={risks} />
                    <InsightList title="Вопросы" items={nextQuestions} />
                  </div>
                  <div className="history-note compact">
                    <Sparkles size={16} aria-hidden="true" />
                    <span>AI-черновик не применяет изменения сам. Решения проходят через предложения изменений и согласование педагога.</span>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">AI-анализ появится после следующей диагностики или обратной связи.</div>
        )}
      </div>
    </div>
  );
}
