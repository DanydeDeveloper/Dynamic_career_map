import { Sparkles } from "lucide-react";
import { assignEventToStudentAction } from "@/app/actions";
import { areaLabel, eventTypeLabels, formatLabels } from "@/lib/constants";
import { formatDate, formatMoney, parseJson } from "@/lib/format";
import type { EventRecommendation } from "@/lib/event-matching";

type EventRecommendationsProps = {
  studentId: string;
  recommendations: EventRecommendation[];
};

export function EventRecommendations({ studentId, recommendations }: EventRecommendationsProps) {
  if (recommendations.length === 0) {
    return <div className="empty-state">Пока нет подходящих мероприятий для рекомендации.</div>;
  }

  return (
    <div className="recommendation-list">
      {recommendations.map((recommendation) => {
        const areas = parseJson<string[]>(recommendation.event.professionalAreasJson, []);

        return (
          <article className="recommendation-card" key={recommendation.event.id}>
            <div className="student-card-top">
              <div>
                <span className="tag primary">Совпадение {recommendation.score}%</span>
                <h3 className="student-name">{recommendation.event.title}</h3>
                <p className="muted">
                  {formatDate(recommendation.event.date)} · {recommendation.event.time} ·{" "}
                  {eventTypeLabels[recommendation.event.eventType] ?? recommendation.event.eventType}
                </p>
              </div>
              <Sparkles size={21} aria-hidden="true" />
            </div>

            <p>{recommendation.explanation}</p>

            <div className="tags">
              <span className="tag accent">{formatLabels[recommendation.event.format] ?? recommendation.event.format}</span>
              <span className="tag">{recommendation.event.city}</span>
              <span className="tag">{formatMoney(recommendation.event.cost)}</span>
              {areas.map((area) => (
                <span className="tag" key={area}>
                  {areaLabel(area)}
                </span>
              ))}
            </div>

            <div className="recommendation-columns">
              <div>
                <strong>Почему подходит</strong>
                <ul>
                  {recommendation.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
              <div>
                <strong>Что учесть</strong>
                {recommendation.risks.length > 0 ? (
                  <ul>
                    {recommendation.risks.map((risk) => (
                      <li key={risk}>{risk}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">Критичных рисков не найдено.</p>
                )}
              </div>
            </div>

            <form action={assignEventToStudentAction} className="recommendation-actions">
              <input name="studentId" type="hidden" value={studentId} />
              <input name="eventId" type="hidden" value={recommendation.event.id} />
              <input name="priority" type="hidden" value={recommendation.score >= 75 ? "required" : "recommended"} />
              <input name="goalForStudent" type="hidden" value={recommendation.goalForStudent} />
              <input name="curatorComment" type="hidden" value={recommendation.curatorComment} />
              <button className="button primary" type="submit">
                Назначить в карту
              </button>
            </form>
          </article>
        );
      })}
    </div>
  );
}
