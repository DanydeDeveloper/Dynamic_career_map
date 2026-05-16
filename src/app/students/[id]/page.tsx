import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageSquarePlus } from "lucide-react";
import { ChangeProposalCard } from "@/components/approvals/ChangeProposalCard";
import { EventTable } from "@/components/events/EventTable";
import { ProfileSummary } from "@/components/students/ProfileSummary";
import { VisibilityBars } from "@/components/students/VisibilityBars";
import { getStudentProfile } from "@/lib/data";
import { prisma } from "@/lib/db";
import { areaLabel } from "@/lib/constants";
import { parseJson } from "@/lib/format";

type StudentPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamicParams = false;

export async function generateStaticParams() {
  const students = await prisma.student.findMany({
    select: { id: true }
  });

  return students.map((student) => ({ id: student.id }));
}

export default async function StudentPage({ params }: StudentPageProps) {
  const { id } = await params;
  const student = await getStudentProfile(id);

  if (!student) {
    notFound();
  }

  const strategy = student.strategy;
  const hypotheses = parseJson<string[]>(strategy?.mainHypothesesJson ?? "[]", []);
  const areasToCheck = parseJson<string[]>(strategy?.areasToCheckJson ?? "[]", []);
  const recommendedFormats = parseJson<string[]>(strategy?.recommendedFormatsJson ?? "[]", []);

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
        <div className="toolbar">
          <Link className="button" href={`/students/${student.id}/diagnostics`}>
            <MessageSquarePlus size={17} aria-hidden="true" />
            Диагностика
          </Link>
        </div>
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
        <EventTable rows={student.eventMap} />
      </section>

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
            student.proposals.map((proposal) => <ChangeProposalCard key={proposal.id} proposal={proposal} />)
          ) : (
            <div className="empty-state">Активных предложений пока нет.</div>
          )}
        </div>
      </section>
    </>
  );
}
