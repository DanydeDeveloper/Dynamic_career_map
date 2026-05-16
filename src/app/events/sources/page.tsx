import { notFound } from "next/navigation";
import { EventSourceForm } from "@/components/forms/EventSourceForm";
import { areaLabel } from "@/lib/constants";
import { getEventSources } from "@/lib/data";
import { parseJson } from "@/lib/format";
import { canManageEvents, requireUser } from "@/lib/authz";

export const dynamic = "force-dynamic";

export default async function EventSourcesPage() {
  const user = await requireUser();

  if (!canManageEvents(user.role)) {
    notFound();
  }

  const sources = await getEventSources();

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Источники мероприятий</p>
          <h1 className="page-title">Где искать профпробы</h1>
          <p className="page-description">
            Список площадок и сайтов, из которых можно собирать события перед модерацией и назначением ученикам.
          </p>
        </div>
      </header>

      <section className="section">
        <div className="grid two">
          {sources.length > 0 ? (
            sources.map((source) => {
              const focusAreas = parseJson<string[]>(source.focusAreasJson, []);

              return (
                <article className="student-card" key={source.id}>
                  <div className="student-card-top">
                    <div>
                      <span className={`tag ${source.isActive ? "primary" : ""}`}>
                        {source.isActive ? "Активен" : "Не активен"}
                      </span>
                      <h2 className="student-name">{source.title}</h2>
                    </div>
                  </div>
                  <p className="muted">{source.url}</p>
                  {source.city ? <p>{source.city}</p> : null}
                  {focusAreas.length > 0 ? (
                    <div className="tags">
                      {focusAreas.map((area) => (
                        <span className="tag" key={area}>
                          {areaLabel(area)}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {source.comment ? <p className="muted">{source.comment}</p> : null}
                </article>
              );
            })
          ) : (
            <div className="empty-state">Источники пока не добавлены.</div>
          )}
        </div>
      </section>

      <EventSourceForm />
    </>
  );
}
