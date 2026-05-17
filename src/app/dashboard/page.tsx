import Link from "next/link";
import { CalendarDays, ClipboardCheck, MessageSquareText, Plus, UsersRound } from "lucide-react";
import { StudentCard } from "@/components/students/StudentCard";
import { getDashboardData } from "@/lib/data";
import { canManageStudents, requireUser } from "@/lib/authz";
import { formatDate } from "@/lib/format";
import { isAppRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

type DashboardStudent = Awaited<ReturnType<typeof getDashboardData>>[number];
type DashboardRole = "ADMIN" | "CURATOR" | "PARENT" | "STUDENT";
type Metric = {
  value: number;
  label: string;
};

const dashboardCopy = {
  ADMIN: {
    eyebrow: "Кабинет администратора",
    title: "Контроль Dynamic Career Map",
    description:
      "Сводка по ученикам, мероприятиям, предложениям изменений и модерации. Администратор видит полный контур продукта и может подключаться к любому рабочему процессу."
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
      "Родитель видит профиль ребенка, назначенные мероприятия и может оставить обратную связь после участия, чтобы педагог уточнил траекторию."
  },
  STUDENT: {
    eyebrow: "Кабинет ученика",
    title: "Моя карьерная карта",
    description:
      "Здесь видны ближайшие мероприятия, текущий профиль интересов и форма впечатлений после профпробы."
  }
};

function getMapItems(students: DashboardStudent[]) {
  return students.flatMap((student) =>
    student.eventMap.map((map) => ({
      ...map,
      studentName: student.name
    }))
  );
}

function getNextEvents(students: DashboardStudent[]) {
  return getMapItems(students)
    .sort((a, b) => a.event.date.getTime() - b.event.date.getTime())
    .slice(0, 4);
}

function getUpcomingCount(students: DashboardStudent[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return getMapItems(students).filter((item) => item.event.date >= today).length;
}

function MetricRow({ metrics }: { metrics: Metric[] }) {
  return (
    <section className="metric-row" aria-label="Сводные показатели">
      {metrics.map((metric) => (
        <div className="metric" key={metric.label}>
          <span className="metric-value">{metric.value}</span>
          <span className="metric-label">{metric.label}</span>
        </div>
      ))}
    </section>
  );
}

function managerMetrics({
  role,
  students,
  pendingCount,
  plannedEventsCount
}: {
  role: DashboardRole;
  students: DashboardStudent[];
  pendingCount: number;
  plannedEventsCount: number;
}): Metric[] {
  const withoutProfileCount = students.filter((student) => !student.profile).length;

  return [
    {
      value: students.length,
      label: role === "ADMIN" ? "учеников в системе" : "учеников в сопровождении"
    },
    {
      value: plannedEventsCount,
      label: "мероприятий в картах"
    },
    {
      value: pendingCount,
      label: "изменений ждут решения"
    },
    {
      value: withoutProfileCount,
      label: "профилей без диагностики"
    }
  ];
}

function personalMetrics({
  students,
  pendingCount,
  plannedEventsCount
}: {
  students: DashboardStudent[];
  pendingCount: number;
  plannedEventsCount: number;
}): Metric[] {
  const feedbackNeededCount = getMapItems(students).filter((item) => item.status === "visited").length;

  return [
    {
      value: students.length,
      label: "профилей в доступе"
    },
    {
      value: plannedEventsCount,
      label: "мероприятий в моей карте"
    },
    {
      value: getUpcomingCount(students),
      label: "ближайших мероприятий"
    },
    {
      value: Math.max(feedbackNeededCount, pendingCount),
      label: "действий по моей карте"
    }
  ];
}

function NextEventsPanel({ students, personal }: { students: DashboardStudent[]; personal: boolean }) {
  const nextEvents = getNextEvents(students);

  return (
    <section className="panel">
      <div className="panel-header">
        <h2 className="panel-title">{personal ? "Мои ближайшие мероприятия" : "Ближайшие мероприятия"}</h2>
      </div>
      <div className="panel-body">
        {nextEvents.length > 0 ? (
          <div className="compact-list">
            {nextEvents.map((item) => (
              <Link className="compact-item" href={`/students/${item.studentId}`} key={item.id}>
                <span>
                  <strong>{item.event.title}</strong>
                  <small>{personal ? item.event.format : item.studentName}</small>
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

function QuickActions({ role }: { role: DashboardRole }) {
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
              <span>{role === "PARENT" ? "Открыть профиль ребенка" : "Открыть мой профиль"}</span>
            </Link>
            <Link className="action-tile" href="/events">
              <CalendarDays size={18} aria-hidden="true" />
              <span>Посмотреть карту мероприятий</span>
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

function StudentGrid({ students, role }: { students: DashboardStudent[]; role: DashboardRole }) {
  const title = studentSectionTitle(role);
  const emptyText =
    role === "PARENT" || role === "STUDENT"
      ? "Профиль пока не привязан к этому аккаунту."
      : "Пока нет учеников в доступе.";

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
        <div className="empty-state">{emptyText}</div>
      )}
    </section>
  );
}

function studentSectionTitle(role: DashboardRole) {
  if (role === "ADMIN") return "Все ученики";
  if (role === "CURATOR") return "Мои ученики";
  if (role === "PARENT") return "Ребенок";
  return "Мой профиль";
}

export default async function DashboardPage() {
  const user = await requireUser();
  const students = await getDashboardData(user);
  const role = (isAppRole(user.role) ? user.role : "CURATOR") as DashboardRole;
  const copy = dashboardCopy[role];
  const isManager = canManageStudents(user.role);
  const pendingCount = students.reduce((sum, student) => sum + student.proposals.length, 0);
  const plannedEventsCount = students.reduce((sum, student) => sum + student.eventMap.length, 0);
  const metrics = isManager
    ? managerMetrics({ role, students, pendingCount, plannedEventsCount })
    : personalMetrics({ students, pendingCount, plannedEventsCount });

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1 className="page-title">{copy.title}</h1>
          <p className="page-description">{copy.description}</p>
        </div>
        {isManager ? (
          <div className="toolbar">
            <Link className="button primary" href="/students/new">
              <Plus size={17} aria-hidden="true" />
              Добавить ученика
            </Link>
          </div>
        ) : null}
      </header>

      <MetricRow metrics={metrics} />

      <section className="grid two">
        <NextEventsPanel students={students} personal={!isManager} />
        <QuickActions role={role} />
      </section>

      <StudentGrid students={students} role={role} />
    </>
  );
}
