import { areaLabel, eventStatusLabels, eventTypeLabels, formatLabels, priorityLabels } from "@/lib/constants";
import { updateEventModerationStatusAction } from "@/app/actions";
import { FormPendingNotice, SubmitButton } from "@/components/forms/SubmitButton";
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
        sourceUrl?: string | null;
        qualityNotes?: string | null;
        source?: { title: string; url: string } | null;
      };
  }>;
  showModerationActions?: boolean;
};

export function EventTable({ rows, showModerationActions = false }: EventTableProps) {
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
            <th>Источник</th>
            <th>Статус</th>
            {showModerationActions ? <th>Модерация</th> : null}
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
                <td>
                  {row.event.source ? (
                    <>
                      <strong>{row.event.source.title}</strong>
                      <br />
                    </>
                  ) : null}
                  <span className="muted">{row.event.sourceUrl ?? row.event.source?.url ?? "Не указан"}</span>
                  {row.event.qualityNotes ? (
                    <>
                      <br />
                      <span className="muted">{row.event.qualityNotes}</span>
                    </>
                  ) : null}
                </td>
                <td>
                  <span className={`tag ${row.event.status === "approved" ? "primary" : row.event.status === "needs_review" ? "warning" : ""}`}>
                    {eventStatusLabels[row.status ?? row.event.status] ?? row.status ?? row.event.status}
                  </span>
                </td>
                {showModerationActions ? (
                  <td>
                    <div className="table-actions">
                      {[
                        ["needs_review", "На модерацию"],
                        ["approved", "Одобрить"],
                        ["rejected", "Отклонить"],
                        ["draft", "В черновик"]
                      ].map(([status, label]) => (
                        <form action={updateEventModerationStatusAction} key={status}>
                          <input name="eventId" type="hidden" value={row.event.id} />
                          <input name="status" type="hidden" value={status} />
                          <FormPendingNotice title="Модерация обновляется" description="Сохраняем новый статус мероприятия." />
                          <SubmitButton
                            className={`button ${status === "approved" ? "primary" : ""}`}
                            pendingText="Обновляем..."
                          >
                            {label}
                          </SubmitButton>
                        </form>
                      ))}
                    </div>
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
