import { areaLabel, eventStatusLabels, eventTypeLabels, formatLabels, priorityLabels } from "@/lib/constants";
import { formatDate, formatMoney, parseJson } from "@/lib/format";

type EventTableProps = {
  rows: Array<{
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
      cost: number;
      professionalAreasJson: string;
      goal: string;
      status: string;
    };
  }>;
};

export function EventTable({ rows }: EventTableProps) {
  if (rows.length === 0) {
    return <div className="empty-state">Мероприятия пока не добавлены.</div>;
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Дата</th>
            <th>Название</th>
            <th>Формат</th>
            <th>Области</th>
            <th>Цель</th>
            <th>Приоритет</th>
            <th>Стоимость</th>
            <th>Статус</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const areas = parseJson<string[]>(row.event.professionalAreasJson, []);

            return (
              <tr key={row.event.id}>
                <td>
                  {formatDate(row.event.date)}
                  <br />
                  <span className="muted">{row.event.time}</span>
                </td>
                <td>
                  <strong>{row.event.title}</strong>
                  <br />
                  <span className="muted">{eventTypeLabels[row.event.eventType] ?? row.event.eventType}</span>
                </td>
                <td>
                  {formatLabels[row.event.format] ?? row.event.format}
                  <br />
                  <span className="muted">{row.event.city}</span>
                </td>
                <td>{areas.map(areaLabel).join(", ")}</td>
                <td>{row.goalForStudent ?? row.event.goal}</td>
                <td>{row.priority ? priorityLabels[row.priority] ?? row.priority : "Не назначен"}</td>
                <td>{formatMoney(row.event.cost)}</td>
                <td>{eventStatusLabels[row.status ?? row.event.status] ?? row.status ?? row.event.status}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
