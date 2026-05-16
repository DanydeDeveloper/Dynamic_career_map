import Link from "next/link";
import { CalendarDays, ClipboardCheck, MessageSquareText, Plus, UsersRound } from "lucide-react";
import { StudentCard } from "@/components/students/StudentCard";
import { getDashboardData } from "@/lib/data";
import { canManageStudents, requireUser } from "@/lib/authz";
import { formatDate } from "@/lib/format";
import { isAppRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

type DashboardStudent = Awaited<ReturnType<typeof getDashboardData>>[number];

const dashboardCopy = {
  ADMIN: {
    eyebrow: "Кабинет администратора",
    title: "Контроль Dynamic Career Map",
    description:
      "Сводка по ученикам, мероприятиям и предложениям изменений. Администратор видит полный контур продукта и может подключаться к любому рабочему процессу."
  },
  CURATOR: {
    eyebrow: "Кабинет педагога",
    title: "Рабочая панель сопровождения",
    description:
      "Здесь собраны ученики, ближайшие профпробы, обратная связь и предложения изменений, которые педагог согласует перед обновлением карты."
  },
  PARENT: {
    eyebrow: "Кабинет родителя",
    title: "Карта развития ребенка",
    description:
      "Родитель видит профиль, назначенные мероприятия и может оставить обратную связь после участия, чтобы педагог уточнил траекторию."
  },
  STUDENT: {
    eyebrow: "Кабинет ученика",
    title: "Моя карьерная карта",
    description:
      "Здесь видны ближайшие мероприятия, текущий профиль интересов и форма впечатлений после профпробы."
  }
};

function getNextEvents(students: DashboardStudent[]) {
  return students
    .flatMap((student) =>
      student.eventMap.map((map) => ({
        ...map,
        studentName: student.name
      }))
    )
    .sort((a, b) => a.event.date.getTime() - b.event.date.getTime())
    .slice(0, 4);
}

function MetricRow({
  students,
  pendingCount,
  plannedEventsCount
}: {
  students: DashboardStudent[];
  pendingCount: number;
  plannedEventsCount: number;
}) {
  const withoutProfileCount = students.filter((student) => !student.profile).length;

  return (
    <section className="metric-row" aria-label="Сводные показатели">
      <div className="metric">
        <span className="metric-value">{students.length}</span>
        <span className="metric-label">учеников в доступе</span>
      </div>
      <div className="metric">
        <span className="metric-value">{plannedEventsCount}</span>
        <span className="metric-label">мероприятий в картах</span>
      </div>
      <div className="metric">
        <span className="metric-value">{pendingCount}</span>
        <span className="metric-label">изменений ждут решения</span>
      </div>
      <div className="metric">
        <span className="metric-value">{withoutProfileCount}</span>
        <span className="metric-label">профилей без диагностики</span>
      </div>
    </section>
  );
}

function NextEventsPanel({ students }: { students: DashboardStudent[] }) {
  const nextEvents = getNextEvents(students);

  return (
    <section className="panel">
      <div className="panel-header">
        <h2 className="panel-title">Ближайшие мероприятия</h2>
      </div>
      <div className="panel-body">
        {nextEvents.length > 0 ? (
          <div className="compact-list">
            {nextEvents.map((item) => (
              <Link className="compact-item" href={`/students/${item.studentId}`} key={item.id}>
                <span>
                  <strong>{item.event.title}</strong>
                  <small>{item.studentName}</small>
                </span>
                <span className="tag primary">{formatDate(item.event.date)}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state">В карте пока нет назначенных мероприятий.</div>
        )}
      </div>
    </section>
  );
}

function QuickActions({ role }: { role: string }) {
  const canManage = role === "ADMIN" || role === "CURATOR";

  return (
    <section className="panel">
      <div className="panel-header">
        <h2 className="panel-title">Быстрые действия</h2>
      </div>
      <div className="panel-body action-grid">
        {canManage ? (
          <>
            <Link className="action-tile" href="/students/new">
              <Plus size={18} aria-hidden="true" />
              <span>Добавить ученика</span>
            </Link>
            <Link className="action-tile" href="/diagnostics">
              <UsersRound size={18} aria-hidden="true" />
              <span>Продолжить диагностику</span>
            </Link>
            <Link className="action-tile" href="/events">
              <CalendarDays size={18} aria-hidden="true" />
              <span>Назначить мероприятие</span>
            </Link>
            <Link className="action-tile" href="/approvals">
              <ClipboardCheck size={18} aria-hidden="true" />
              <span>Разобрать согласование</span>
            </Link>
          </>
        ) : (
          <>
            <Link className="action-tile" href="/students">
              <UsersRound size={18} aria-hidden="true" />
              <span>Открыть профиль</span>
            </Link>
            <Link className="action-tile" href="/events">
              <CalendarDays size={18} aria-hidden="true" />
              <span>Посмотреть карту</span>
            </Link>
            <Link className="action-tile" href="/feedback">
              <MessageSquareText size={18} aria-hidden="true" />
              <span>Оставить обратную связь</span>
            </Link>
          </>
        )}
      </div>
    </section>
  );
}

function StudentGrid({ students, title }: { students: DashboardStudent[]; title: string }) {
  return (
    <section className="section">
      <h2 className="section-title">{title}</h2>
      {students.length > 0 ? (
        <div className="grid two">
          {students.map((student) => (
            <StudentCard key={student.id} student={student} />
          ))}
        </div>
      ) : (
        <div className="empty-state">Пока нет учеников в доступе.</div>
      )}
    </section>
  );
}

function studentSectionTitle(role: keyof typeof dashboardCopy) {
  if (role === "ADMIN") return "Все ученики";
  if (role === "CURATOR") return "Мои ученики";
  if (role === "PARENT") return "Ребенок";
  return "Мой профиль";
}

export default async function DashboardPage() {
  const user = await requireUser();
  const students = await getDashboardData(user);
  const role = isAppRole(user.role) ? user.role : "CURATOR";
  const copy = dashboardCopy[role];
  const pendingCount = students.reduce((sum, student) => sum + student.proposals.length, 0);
  const plannedEventsCount = students.reduce((sum, student) => sum + student.eventMap.length, 0);

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1 className="page-title">{copy.title}</h1>
          <p className="page-description">{copy.description}</p>
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

      <MetricRow students={students} pendingCount={pendingCount} plannedEventsCount={plannedEventsCount} />

      <section className="grid two">
        <NextEventsPanel students={students} />
        <QuickActions role={role} />
      </section>

      <StudentGrid students={students} title={studentSectionTitle(role)} />
    </>
  );
}
