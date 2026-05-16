import { CalendarDays } from "lucide-react";
import { areaLabel, eventStatusLabels, eventTypeLabels, formatLabels, priorityLabels } from "@/lib/constants";
import { formatDate, parseJson } from "@/lib/format";

export type EventMapRow = {
  id?: string;
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
};

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

  if (status === "feedback_completed" || status === "completed") {
    return eventStatusLabels[status] ?? status;
  }

  if (status === "visited" || row.event.date < now) {
    return "Нужна обратная связь";
  }

  return eventStatusLabels[status] ?? status;
}

function buildHorizons(rows: EventMapRow[]) {
  const now = new Date();
  const month1 = addMonths(now, 1);
  const month3 = addMonths(now, 3);
  const month12 = addMonths(now, 12);
  const sorted = [...rows].sort((a, b) => a.event.date.getTime() - b.event.date.getTime());

  const past = sorted.filter((row) => row.event.date < now);
  const next1 = sorted.filter((row) => row.event.date >= now && row.event.date <= month1);
  const next3 = sorted.filter((row) => row.event.date > month1 && row.event.date <= month3);
  const next12 = sorted.filter((row) => row.event.date > month3 && row.event.date <= month12);
  const later = sorted.filter((row) => row.event.date > month12);

  return [
    {
      key: "next-1",
      title: "1 месяц",
      description: "Ближайшие профпробы и события, по которым важно быстро собрать обратную связь.",
      rows: next1
    },
    {
      key: "next-3",
      title: "3 месяца",
      description: "Средний горизонт проверки гипотез: разные форматы и области без перегруза.",
      rows: next3
    },
    {
      key: "next-12",
      title: "12 месяцев",
      description: "Годовая рамка развития: расширение насмотренности и плановая смена форматов.",
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
      title: "Позже",
      description: "События за пределами годового горизонта.",
      rows: later
    }
  ] satisfies Horizon[];
}

export function EventMapTimeline({ rows, emptyText = "Мероприятия пока не добавлены." }: EventMapTimelineProps) {
  if (rows.length === 0) {
    return <div className="empty-state">{emptyText}</div>;
  }

  const now = new Date();
  const horizons = buildHorizons(rows).filter((horizon) => horizon.rows.length > 0);

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

                          {row.curatorComment ? <p className="muted">{row.curatorComment}</p> : null}
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
