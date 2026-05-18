import Link from "next/link";
import { CalendarDays, Check, ClipboardCheck, Footprints, X } from "lucide-react";
import { reviewStudentEventSelectionAction, selectEventForStudentAction, updateStudentEventStatusAction } from "@/app/actions";
import { FormPendingNotice, SubmitButton } from "@/components/forms/SubmitButton";
import { areaLabel, eventStatusLabels, eventTypeLabels, formatLabels, priorityLabels } from "@/lib/constants";
import { formatDate, parseJson } from "@/lib/format";

export type EventMapRow = {
  id?: string;
  studentId?: string;
  priority?: string;
  status?: string;
  goalForStudent?: string;
  curatorComment?: string | null;
  event: {
    id: string;
    title: string;
    date: Date;
    time: string;
    format: string;
    participationFormat: string;
    eventType: string;
    city: string;
    professionalAreasJson: string;
    goal: string;
    status: string;
  };
};

type EventMapTimelineProps = {
  rows: EventMapRow[];
  emptyText?: string;
  showStatusControls?: boolean;
  curatorName?: string | null;
  priorityFirst?: boolean;
  showCuratorComment?: boolean;
  showSelectionControls?: boolean;
  showSelectionReviewControls?: boolean;
  selectableStudentId?: string;
};

const statusSteps = [
  {
    value: "selected",
    label: "Выбрано",
    icon: Check
  },
  {
    value: "visited",
    label: "Сходили",
    icon: Footprints
  },
  {
    value: "feedback_completed",
    label: "Обратная связь",
    icon: ClipboardCheck
  }
] as const;

type Horizon = {
  key: string;
  title: string;
  description: string;
  rows: EventMapRow[];
};

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    month: "long",
    year: "numeric"
  }).format(date);
}

function groupByMonth(rows: EventMapRow[]) {
  const groups = new Map<string, { label: string; rows: EventMapRow[] }>();

  for (const row of rows) {
    const key = monthKey(row.event.date);
    const existing = groups.get(key);

    if (existing) {
      existing.rows.push(row);
    } else {
      groups.set(key, {
        label: monthLabel(row.event.date),
        rows: [row]
      });
    }
  }

  return Array.from(groups.values());
}

function statusForRow(row: EventMapRow, now: Date) {
  const status = row.status ?? row.event.status;

  if (status === "available") {
    return "Доступно для выбора";
  }

  if (status === "selected" && row.priority === "student_choice") {
    return "На согласовании у куратора";
  }

  if (status === "feedback_completed" || status === "completed") {
    return eventStatusLabels[status] ?? status;
  }

  if (status === "visited" && row.event.date <= now) {
    return "Нужна обратная связь";
  }

  return eventStatusLabels[status] ?? status;
}

const priorityRank: Record<string, number> = {
  required: 0,
  recommended: 1,
  student_choice: 2,
  optional: 3
};

function sortRows(rows: EventMapRow[], priorityFirst: boolean) {
  return [...rows].sort((a, b) => {
    if (priorityFirst) {
      const priorityDiff = (priorityRank[a.priority ?? ""] ?? 9) - (priorityRank[b.priority ?? ""] ?? 9);

      if (priorityDiff !== 0) {
        return priorityDiff;
      }
    }

    return a.event.date.getTime() - b.event.date.getTime();
  });
}

function buildHorizons(rows: EventMapRow[], priorityFirst: boolean) {
  const now = new Date();
  const month1 = addMonths(now, 1);
  const month3 = addMonths(now, 3);
  const month12 = addMonths(now, 12);
  const sorted = sortRows(rows, priorityFirst);

  const past = sorted.filter((row) => row.event.date < now);
  const next1 = sorted.filter((row) => row.event.date >= now && row.event.date <= month1);
  const next3 = sorted.filter((row) => row.event.date > month1 && row.event.date <= month3);
  const next12 = sorted.filter((row) => row.event.date > month3 && row.event.date <= month12);
  const later = sorted.filter((row) => row.event.date > month12);

  return [
    {
      key: "next-1",
      title: "Ближайший месяц",
      description: "События по дате проведения: ближайшие профпробы, которые стоит выбрать или подтвердить первыми.",
      rows: next1
    },
    {
      key: "next-3",
      title: "Следующие 3 месяца",
      description: "События после ближайшего месяца, но в пределах трех месяцев от сегодня.",
      rows: next3
    },
    {
      key: "next-12",
      title: "До конца года",
      description: "События дальше трех месяцев, но в пределах годового горизонта карты.",
      rows: next12
    },
    {
      key: "past",
      title: "Прошедшие",
      description: "События, по которым уже можно разбирать впечатления и предложения изменений.",
      rows: past
    },
    {
      key: "later",
      title: "Дальше",
      description: "События за пределами ближайших 12 месяцев.",
      rows: later
    }
  ] satisfies Horizon[];
}

export function EventMapTimeline({
  rows,
  emptyText = "Мероприятия пока не добавлены.",
  showStatusControls = false,
  curatorName,
  priorityFirst = false,
  showCuratorComment = true,
  showSelectionControls = false,
  showSelectionReviewControls = false,
  selectableStudentId
}: EventMapTimelineProps) {
  if (rows.length === 0) {
    return <div className="empty-state">{emptyText}</div>;
  }

  const now = new Date();
  const horizons = buildHorizons(rows, priorityFirst).filter((horizon) => horizon.rows.length > 0);

  return (
    <div className="event-map">
      {horizons.map((horizon) => (
        <section className="event-horizon" key={horizon.key}>
          <div className="event-horizon-header">
            <div>
              <h3>{horizon.title}</h3>
              <p>{horizon.description}</p>
            </div>
            <span className="tag primary">{horizon.rows.length}</span>
          </div>

          <div className="month-grid">
            {groupByMonth(horizon.rows).map((month) => (
              <div className="month-group" key={`${horizon.key}-${month.label}`}>
                <div className="month-label">{month.label}</div>
                <div className="event-card-list">
                  {month.rows.map((row) => {
                    const areas = parseJson<string[]>(row.event.professionalAreasJson, []);
                    const status = statusForRow(row, now);
                    const currentStatus = row.status ?? row.event.status;
                    const canReviewSelection =
                      showSelectionReviewControls && Boolean(row.id) && row.status === "selected" && row.priority === "student_choice";
                    const canShowControls = showStatusControls && Boolean(row.id) && !canReviewSelection;
                    const canSelectEvent = showSelectionControls && selectableStudentId && !row.id;

                    return (
                      <article className="event-map-card" key={row.id ?? `${horizon.key}-${row.event.id}`}>
                        <div className="event-map-date">
                          <CalendarDays size={16} aria-hidden="true" />
                          <span>{formatDate(row.event.date)}</span>
                          <small>{row.event.time}</small>
                        </div>
                        <div className="event-map-content">
                          <div className="student-card-top">
                            <div>
                              <h4>{row.event.title}</h4>
                              <p className="muted">
                                {eventTypeLabels[row.event.eventType] ?? row.event.eventType} ·{" "}
                                {formatLabels[row.event.format] ?? row.event.format} · {row.event.city}
                              </p>
                            </div>
                            <span className={`tag ${status === "Нужна обратная связь" ? "warning" : "accent"}`}>
                              {status}
                            </span>
                          </div>

                          <p>{row.goalForStudent ?? row.event.goal}</p>

                          <div className="tags">
                            {row.priority ? (
                              <span className="tag primary">{priorityLabels[row.priority] ?? row.priority}</span>
                            ) : null}
                            {areas.map((area) => (
                              <span className="tag" key={area}>
                                {areaLabel(area)}
                              </span>
                            ))}
                          </div>

                          {showCuratorComment && row.curatorComment ? (
                            <p className="muted">
                              <strong>Комментарий куратора{curatorName ? ` ${curatorName}` : ""}:</strong>{" "}
                              {row.curatorComment}
                            </p>
                          ) : null}

                          {canShowControls ? (
                            <div className="event-status-controls" aria-label={`Статус мероприятия ${row.event.title}`}>
                              {statusSteps.map((step) => {
                                const Icon = step.icon;
                                const isActive = currentStatus === step.value;
                                const isFeedbackStep = step.value === "feedback_completed";

                                if (isFeedbackStep) {
                                  return (
                                    <Link
                                      className={`status-step ${isActive ? "active" : ""}`}
                                      href={
                                        row.studentId
                                          ? `/feedback?studentId=${row.studentId}&eventId=${row.event.id}`
                                          : "/feedback"
                                      }
                                      key={step.value}
                                      title="Заполнить обратную связь"
                                    >
                                      <Icon size={15} aria-hidden="true" />
                                      <span>{step.label}</span>
                                    </Link>
                                  );
                                }

                                return (
                                  <form action={updateStudentEventStatusAction} key={step.value}>
                                    <input name="studentEventMapId" type="hidden" value={row.id} />
                                    <input name="status" type="hidden" value={step.value} />
                                    <FormPendingNotice title="Статус обновляется" description="Сохраняем отметку в карте мероприятий." />
                                    <SubmitButton
                                      className={`status-step ${isActive ? "active" : ""}`}
                                      disabled={isActive}
                                      pendingText="Отмечаем..."
                                      title={`Отметить: ${step.label.toLowerCase()}`}
                                    >
                                      <Icon size={15} aria-hidden="true" />
                                      <span>{step.label}</span>
                                    </SubmitButton>
                                  </form>
                                );
                              })}
                            </div>
                          ) : null}

                          {canReviewSelection ? (
                            <div className="event-status-controls" aria-label={`Согласование выбора ${row.event.title}`}>
                              <form action={reviewStudentEventSelectionAction}>
                                <input name="studentEventMapId" type="hidden" value={row.id} />
                                <input name="decision" type="hidden" value="approved" />
                                <FormPendingNotice
                                  title="Согласуем выбор"
                                  description="Добавляем мероприятие в карту ученика как рекомендацию к посещению."
                                />
                                <SubmitButton className="status-step select-action" pendingText="Согласуем...">
                                  <Check size={15} aria-hidden="true" />
                                  <span>Одобрить выбор</span>
                                </SubmitButton>
                              </form>
                              <form action={reviewStudentEventSelectionAction}>
                                <input name="studentEventMapId" type="hidden" value={row.id} />
                                <input name="decision" type="hidden" value="rejected" />
                                <FormPendingNotice
                                  title="Отклоняем выбор"
                                  description="Убираем мероприятие из карты ученика и фиксируем решение в журнале."
                                />
                                <SubmitButton className="status-step" pendingText="Отклоняем...">
                                  <X size={15} aria-hidden="true" />
                                  <span>Отклонить</span>
                                </SubmitButton>
                              </form>
                            </div>
                          ) : null}

                          {canSelectEvent ? (
                            <form action={selectEventForStudentAction} className="event-status-controls">
                              <input name="studentId" type="hidden" value={selectableStudentId} />
                              <input name="eventId" type="hidden" value={row.event.id} />
                              <FormPendingNotice
                                title="Мероприятие выбирается"
                                description="Добавляем событие в карту, чтобы куратор увидел выбор."
                              />
                              <SubmitButton className="status-step select-action" pendingText="Выбираем...">
                                <Check size={15} aria-hidden="true" />
                                <span>Выбрать</span>
                              </SubmitButton>
                            </form>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
