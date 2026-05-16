import { Activity, GitCompareArrows, History, Route } from "lucide-react";
import { areaLabel, eventStatusLabels, priorityLabels, proposalStatusLabels, proposalTypeLabels } from "@/lib/constants";
import { formatDate, parseJson } from "@/lib/format";

type DiagnosticHistoryItem = {
  id: string;
  interestsJson: string;
  summaryText: string;
  status: string;
  appliedToProfileAt: Date | null;
  createdAt: Date;
};

type StudentChangeHistoryProps = {
  student: {
    createdAt: Date;
    updatedAt: Date;
    profile: { updatedAt: Date } | null;
    strategy: { updatedAt: Date; next3MonthsFocus: string } | null;
    diagnostics: DiagnosticHistoryItem[];
    feedback: Array<{
      id: string;
      interestScore: number;
      difficultyScore: number;
      engagementScore: number;
      fatigueScore: number;
      wantContinue: string;
      liked: string | null;
      wantTryNext: string | null;
      createdAt: Date;
      event: { title: string };
    }>;
    proposals: Array<{
      id: string;
      proposalType: string;
      description: string;
      reason: string;
      status: string;
      createdAt: Date;
      approvedAt: Date | null;
      triggerEvent: { title: string } | null;
    }>;
    eventMap: Array<{
      id: string;
      priority: string;
      status: string;
      goalForStudent: string;
      createdAt: Date;
      updatedAt: Date;
      event: { title: string };
    }>;
    visibility: Array<{
      area: string;
      score: number;
      level: string;
      updatedAt: Date;
    }>;
  };
};

type TimelineItem = {
  id: string;
  date: Date;
  title: string;
  description: string;
  tag: string;
  tone?: "primary" | "accent" | "warning";
  details?: string[];
};

function isMeaningfullyLater(left: Date, right: Date) {
  return left.getTime() - right.getTime() > 1000;
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(value);
}

function buildTimeline(student: StudentChangeHistoryProps["student"]) {
  const items: TimelineItem[] = [
    {
      id: "student-created",
      date: student.createdAt,
      title: "Карточка ученика создана",
      description: "Начальная точка профориентационной траектории.",
      tag: "Старт",
      tone: "primary"
    }
  ];

  if (student.profile) {
    items.push({
      id: "profile-current",
      date: student.profile.updatedAt,
      title: "Профиль обновлен",
      description: "Актуализированы интересы, склонности, форматы активности или характеристика.",
      tag: "Профиль",
      tone: "primary"
    });
  }

  if (student.strategy) {
    items.push({
      id: "strategy-current",
      date: student.strategy.updatedAt,
      title: "Стратегия обновлена",
      description: student.strategy.next3MonthsFocus,
      tag: "Стратегия",
      tone: "accent"
    });
  }

  const latestVisibilityAt = student.visibility.reduce<Date | null>((latest, item) => {
    if (!latest || item.updatedAt > latest) {
      return item.updatedAt;
    }

    return latest;
  }, null);

  if (latestVisibilityAt) {
    items.push({
      id: "visibility-current",
      date: latestVisibilityAt,
      title: "Насмотренность изменена",
      description: "Обновлены текущие уровни знакомства с профессиональными областями.",
      tag: "Насмотренность",
      details: student.visibility
        .slice()
        .sort((a, b) => b.score - a.score)
        .slice(0, 4)
        .map((item) => `${areaLabel(item.area)}: ${item.score}% · ${item.level}`)
    });
  }

  for (const diagnostic of student.diagnostics) {
    items.push({
      id: `diagnostic-created-${diagnostic.id}`,
      date: diagnostic.createdAt,
      title: "Диагностика создана",
      description: diagnostic.summaryText,
      tag: diagnostic.status === "applied" ? "Применена" : diagnostic.status,
      tone: "primary"
    });

    if (diagnostic.appliedToProfileAt) {
      items.push({
        id: `diagnostic-applied-${diagnostic.id}`,
        date: diagnostic.appliedToProfileAt,
        title: "Профиль обновлен по диагностике",
        description: "Результаты диагностики перенесены в профиль ученика.",
        tag: "Профиль",
        tone: "primary"
      });
    }
  }

  for (const feedback of student.feedback) {
    items.push({
      id: `feedback-${feedback.id}`,
      date: feedback.createdAt,
      title: "Обратная связь оставлена",
      description: `${feedback.event.title}: интерес ${feedback.interestScore}/10, вовлеченность ${feedback.engagementScore}/10, сложность ${feedback.difficultyScore}/10.`,
      tag: "Обратная связь",
      tone: "warning",
      details: [
        feedback.liked ? `Понравилось: ${feedback.liked}` : null,
        feedback.wantTryNext ? `Дальше попробовать: ${feedback.wantTryNext}` : null,
        feedback.wantContinue ? `Продолжать: ${feedback.wantContinue}` : null
      ].filter(Boolean) as string[]
    });
  }

  for (const proposal of student.proposals) {
    const typeLabel = proposalTypeLabels[proposal.proposalType] ?? proposal.proposalType;

    items.push({
      id: `proposal-created-${proposal.id}`,
      date: proposal.createdAt,
      title: "Предложение создано",
      description: `${typeLabel}: ${proposal.description}`,
      tag: proposalStatusLabels[proposal.status] ?? proposal.status,
      details: [proposal.triggerEvent?.title, proposal.reason].filter(Boolean) as string[]
    });

    if (proposal.approvedAt && (proposal.status === "approved" || proposal.status === "edited")) {
      items.push({
        id: `proposal-approved-${proposal.id}`,
        date: proposal.approvedAt,
        title: proposal.status === "edited" ? "Предложение изменено и согласовано" : "Предложение согласовано",
        description: `${typeLabel}: изменения применены к траектории ученика.`,
        tag: "Согласование",
        tone: "accent"
      });
    }
  }

  for (const mapItem of student.eventMap) {
    items.push({
      id: `map-created-${mapItem.id}`,
      date: mapItem.createdAt,
      title: "Мероприятие добавлено в карту",
      description: `${mapItem.event.title}: ${mapItem.goalForStudent}`,
      tag: priorityLabels[mapItem.priority] ?? mapItem.priority,
      tone: "primary"
    });

    if (isMeaningfullyLater(mapItem.updatedAt, mapItem.createdAt)) {
      items.push({
        id: `map-updated-${mapItem.id}`,
        date: mapItem.updatedAt,
        title: "Карта мероприятий обновлена",
        description: mapItem.event.title,
        tag: eventStatusLabels[mapItem.status] ?? mapItem.status,
        tone: "accent"
      });
    }
  }

  return items
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 24);
}

function buildInterestRows(diagnostics: DiagnosticHistoryItem[]) {
  const snapshots = diagnostics
    .slice()
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((diagnostic) => ({
      id: diagnostic.id,
      date: diagnostic.createdAt,
      interests: parseJson<Record<string, number>>(diagnostic.interestsJson, {})
    }));

  const latest = snapshots.at(-1);
  const previous = snapshots.at(-2);
  const first = snapshots.at(0);
  const areas = new Set<string>();

  for (const snapshot of snapshots) {
    for (const area of Object.keys(snapshot.interests)) {
      areas.add(area);
    }
  }

  return Array.from(areas)
    .map((area) => {
      const firstScore = first?.interests[area] ?? 0;
      const previousScore = previous?.interests[area] ?? firstScore;
      const latestScore = latest?.interests[area] ?? 0;
      const totalDelta = latestScore - firstScore;
      const lastDelta = latestScore - previousScore;

      return {
        area,
        latestScore,
        previousScore,
        firstScore,
        totalDelta,
        lastDelta,
        trend: snapshots.map((snapshot) => snapshot.interests[area] ?? 0)
      };
    })
    .sort((a, b) => Math.abs(b.totalDelta) - Math.abs(a.totalDelta) || b.latestScore - a.latestScore);
}

function deltaLabel(value: number) {
  if (value > 0) {
    return `+${value}`;
  }

  return String(value);
}

function trendClass(value: number) {
  if (value > 0) {
    return "positive";
  }

  if (value < 0) {
    return "negative";
  }

  return "neutral";
}

export function StudentChangeHistory({ student }: StudentChangeHistoryProps) {
  const timeline = buildTimeline(student);
  const interestRows = buildInterestRows(student.diagnostics);
  const diagnosticDates = student.diagnostics
    .slice()
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((diagnostic) => formatDate(diagnostic.createdAt));

  return (
    <div className="history-grid">
      <div className="panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Лента изменений</h2>
            <p className="panel-subtitle">Диагностики, обратная связь, согласования и изменения карты.</p>
          </div>
          <History size={20} aria-hidden="true" />
        </div>
        <div className="panel-body">
          <div className="change-timeline">
            {timeline.map((item) => (
              <article className="timeline-item" key={item.id}>
                <div className={`timeline-marker ${item.tone ?? ""}`} aria-hidden="true" />
                <div className="timeline-content">
                  <div className="timeline-top">
                    <div>
                      <span className="timeline-date">{formatDateTime(item.date)}</span>
                      <h3>{item.title}</h3>
                    </div>
                    <span className={`tag ${item.tone ?? ""}`}>{item.tag}</span>
                  </div>
                  <p>{item.description}</p>
                  {item.details && item.details.length > 0 ? (
                    <div className="timeline-details">
                      {item.details.map((detail) => (
                        <span key={detail}>{detail}</span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Динамика интересов</h2>
            <p className="panel-subtitle">Сравнение результатов диагностики по профессиональным областям.</p>
          </div>
          <GitCompareArrows size={20} aria-hidden="true" />
        </div>
        <div className="panel-body">
          {interestRows.length > 0 ? (
            <div className="interest-dynamics">
              <div className="timeline-details">
                {diagnosticDates.map((date) => (
                  <span key={date}>{date}</span>
                ))}
              </div>

              {student.diagnostics.length < 2 ? (
                <div className="empty-state compact">Для динамики нужна минимум еще одна диагностика.</div>
              ) : null}

              <div className="interest-dynamics-list">
                {interestRows.slice(0, 8).map((row) => (
                  <article className="interest-dynamics-row" key={row.area}>
                    <div>
                      <h3>{areaLabel(row.area)}</h3>
                      <p className="muted">
                        было {row.previousScore}/10 · стало {row.latestScore}/10
                      </p>
                    </div>
                    <div className="interest-sparkline" aria-label={`Динамика ${areaLabel(row.area)}`}>
                      {row.trend.map((score, index) => (
                        <span
                          key={`${row.area}-${index}`}
                          style={{ height: `${Math.max(12, score * 9)}%` }}
                          title={`${score}/10`}
                        />
                      ))}
                    </div>
                    <div className="delta-stack">
                      <span className={`delta-pill ${trendClass(row.lastDelta)}`}>
                        <Activity size={13} aria-hidden="true" />
                        {deltaLabel(row.lastDelta)}
                      </span>
                      <span className="muted">с последней диагностики</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state">Диагностик с интересами пока нет.</div>
          )}
        </div>
      </div>

      <div className="history-note">
        <Route size={18} aria-hidden="true" />
        <span>
          Лента строится из фактических записей приложения. Для полной аудиторской истории на следующем шаге можно
          добавить отдельный журнал событий.
        </span>
      </div>
    </div>
  );
}
