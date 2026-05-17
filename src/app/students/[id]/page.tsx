import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageSquarePlus } from "lucide-react";
import { ChangeProposalCard } from "@/components/approvals/ChangeProposalCard";
import { EventRecommendations } from "@/components/events/EventRecommendations";
import { EventMapTimeline } from "@/components/events/EventMapTimeline";
import { StudentAiInsights } from "@/components/students/StudentAiInsights";
import { ProfileSummary } from "@/components/students/ProfileSummary";
import { StudentChangeHistory } from "@/components/students/StudentChangeHistory";
import { VisibilityBars } from "@/components/students/VisibilityBars";
import { getApprovedEvents, getStudentProfile } from "@/lib/data";
import { canManageApprovals, canManageStudents, requireUser } from "@/lib/authz";
import { areaLabel } from "@/lib/constants";
import { recommendEventsForStudent } from "@/lib/event-matching";
import { formatDate, parseJson } from "@/lib/format";

type StudentPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function StudentPage({ params }: StudentPageProps) {
  const { id } = await params;
  const user = await requireUser();
  const student = await getStudentProfile(id, user);

  if (!student) {
    notFound();
  }

  const strategy = student.strategy;
  const hypotheses = parseJson<string[]>(strategy?.mainHypothesesJson ?? "[]", []);
  const areasToCheck = parseJson<string[]>(strategy?.areasToCheckJson ?? "[]", []);
  const recommendedFormats = parseJson<string[]>(strategy?.recommendedFormatsJson ?? "[]", []);
  const canManageStudent = canManageStudents(user.role);
  const eventRecommendations = canManageStudent
    ? recommendEventsForStudent(student, await getApprovedEvents(), 5)
    : [];

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Профиль ученика</p>
          <h1 className="page-title">{student.name}</h1>
          <p className="page-description">
            {student.grade}, {student.age} лет, {student.city}. Куратор: {student.curatorName ?? "не назначен"}.
          </p>
        </div>
        {canManageStudent ? (
          <div className="toolbar">
            <Link className="button" href={`/students/${student.id}/diagnostics`}>
              <MessageSquarePlus size={17} aria-hidden="true" />
              Диагностика
            </Link>
          </div>
        ) : null}
      </header>

      <section className="section">
        <div className="panel">
          <div className="panel-header">
            <h2 className="panel-title">Общая профориентационная характеристика</h2>
          </div>
          <div className="panel-body">
            <ProfileSummary profile={student.profile} />
          </div>
        </div>
      </section>

      <section className="section">
        <StudentChangeHistory student={student} />
      </section>

      <section className="section">
        <StudentAiInsights insights={student.aiInsights} />
      </section>

      <section className="section">
        <div className="panel">
          <div className="panel-header">
            <h2 className="panel-title">История диагностики</h2>
          </div>
          <div className="panel-body">
            {student.diagnostics.length > 0 ? (
              <div className="diagnostic-history">
                {student.diagnostics.map((diagnostic) => {
                  const interests = parseJson<Record<string, number>>(diagnostic.interestsJson, {});
                  const topInterests = Object.entries(interests)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3);

                  return (
                    <article className="diagnostic-item" key={diagnostic.id}>
                      <div className="student-card-top">
                        <div>
                          <h3 className="student-name">{formatDate(diagnostic.createdAt)}</h3>
                          <p className="muted">
                            Автор: {diagnostic.author?.name ?? diagnostic.author?.email ?? "не указан"}
                          </p>
                        </div>
                        <span className="tag primary">
                          {diagnostic.appliedToProfileAt ? "Применено к профилю" : diagnostic.status}
                        </span>
                      </div>

                      <p>{diagnostic.summaryText}</p>

                      <div className="tags">
                        {topInterests.map(([area, score]) => (
                          <span className="tag" key={area}>
                            {areaLabel(area)}: {score}/10
                          </span>
                        ))}
                      </div>

                      <div className="diagnostic-notes">
                        {diagnostic.likedActivities ? (
                          <p>
                            <strong>Нравится:</strong> {diagnostic.likedActivities}
                          </p>
                        ) : null}
                        {diagnostic.subjects ? (
                          <p>
                            <strong>Предметы:</strong> {diagnostic.subjects}
                          </p>
                        ) : null}
                        {diagnostic.experience ? (
                          <p>
                            <strong>Опыт:</strong> {diagnostic.experience}
                          </p>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">Отдельных диагностических сессий пока нет.</div>
            )}
          </div>
        </div>
      </section>

      <section className="section grid two">
        <div className="panel">
          <div className="panel-header">
            <h2 className="panel-title">Насмотренность</h2>
          </div>
          <div className="panel-body">
            <VisibilityBars items={student.visibility} />
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2 className="panel-title">Стратегия</h2>
          </div>
          <div className="panel-body">
            {strategy ? (
              <>
                <p>{strategy.strategySummary}</p>
                <div className="split-line" />
                <strong>Гипотезы</strong>
                <div className="tags">
                  {hypotheses.map((item) => (
                    <span className="tag" key={item}>
                      {item}
                    </span>
                  ))}
                </div>
                <div className="split-line" />
                <strong>Проверить</strong>
                <div className="tags">
                  {areasToCheck.map((area) => (
                    <span className="tag primary" key={area}>
                      {areaLabel(area)}
                    </span>
                  ))}
                </div>
                <div className="split-line" />
                <strong>Рекомендуемые форматы</strong>
                <div className="tags">
                  {recommendedFormats.map((format) => (
                    <span className="tag accent" key={format}>
                      {format}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-state">Стратегия пока не сформирована.</div>
            )}
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Карта мероприятий</h2>
        <EventMapTimeline rows={student.eventMap} emptyText="В карте пока нет назначенных мероприятий." showStatusControls />
      </section>

      {canManageStudent ? (
        <section className="section">
          <h2 className="section-title">Подходящие мероприятия</h2>
          <EventRecommendations studentId={student.id} recommendations={eventRecommendations} />
        </section>
      ) : null}

      <section className="section">
        <h2 className="section-title">Ранее посещаемые кружки и активности</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Активность</th>
                <th>Период</th>
                <th>Направление</th>
                <th>Результат</th>
                <th>Отношение ребенка</th>
              </tr>
            </thead>
            <tbody>
              {student.pastActivities.map((activity) => (
                <tr key={activity.id}>
                  <td>{activity.title}</td>
                  <td>{activity.period}</td>
                  <td>{areaLabel(activity.area)}</td>
                  <td>{activity.result ?? "Не указано"}</td>
                  <td>{activity.studentReaction ?? "Не указано"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Предложения изменений</h2>
        <div className="grid">
          {student.proposals.length > 0 ? (
            student.proposals.map((proposal) => (
              <ChangeProposalCard key={proposal.id} proposal={proposal} showActions={canManageApprovals(user.role)} />
            ))
          ) : (
            <div className="empty-state">Активных предложений пока нет.</div>
          )}
        </div>
      </section>
    </>
  );
}
