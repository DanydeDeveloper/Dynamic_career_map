import Link from "next/link";
import { Plus } from "lucide-react";
import { StudentCard } from "@/components/students/StudentCard";
import { getDashboardData } from "@/lib/data";
import { canManageStudents, requireUser } from "@/lib/authz";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const students = await getDashboardData(user);
  const pendingCount = students.reduce((sum, student) => sum + student.proposals.length, 0);
  const plannedEventsCount = students.reduce((sum, student) => sum + student.eventMap.length, 0);

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Педагогический кабинет</p>
          <h1 className="page-title">Динамическая карта профпроб</h1>
          <p className="page-description">
            Первый MVP фокусируется на работе педагога: профиль ученика, насмотренность, карта мероприятий,
            фидбэк и предложения изменений с обязательным апрувом.
          </p>
        </div>
        {canManageStudents(user.role) ? (
          <div className="toolbar">
            <Link className="button primary" href="/students/new">
              <Plus size={17} aria-hidden="true" />
              Добавить ученика
            </Link>
          </div>
        ) : null}
      </header>

      <section className="metric-row" aria-label="Сводные показатели">
        <div className="metric">
          <span className="metric-value">{students.length}</span>
          <span className="metric-label">учеников в системе</span>
        </div>
        <div className="metric">
          <span className="metric-value">{plannedEventsCount}</span>
          <span className="metric-label">мероприятий в картах</span>
        </div>
        <div className="metric">
          <span className="metric-value">{pendingCount}</span>
          <span className="metric-label">предложений ждут решения</span>
        </div>
        <div className="metric">
          <span className="metric-value">3</span>
          <span className="metric-label">горизонта планирования</span>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Ученики</h2>
        {students.length > 0 ? (
          <div className="grid two">
            {students.map((student) => (
              <StudentCard key={student.id} student={student} />
            ))}
          </div>
        ) : (
          <div className="empty-state">Пока нет учеников. Начните с диагностики.</div>
        )}
      </section>
    </>
  );
}
