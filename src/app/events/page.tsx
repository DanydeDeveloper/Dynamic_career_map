import Link from "next/link";
import { Plus, RadioTower } from "lucide-react";
import { AssignEventForm } from "@/components/forms/AssignEventForm";
import { EventMapTimeline } from "@/components/events/EventMapTimeline";
import { EventTable } from "@/components/events/EventTable";
import { eventModerationStatusLabels } from "@/lib/constants";
import { getApprovedEvents, getDashboardData, getEvents, getStudentsForForms } from "@/lib/data";
import { canManageEvents, requireUser } from "@/lib/authz";

export const dynamic = "force-dynamic";

type EventsPageProps = {
  searchParams?: Promise<{ status?: string }>;
};

const moderationTabs = [
  ["all", "Все"],
  ["needs_review", eventModerationStatusLabels.needs_review],
  ["approved", eventModerationStatusLabels.approved],
  ["draft", eventModerationStatusLabels.draft],
  ["rejected", eventModerationStatusLabels.rejected]
] as const;

function sortEventsForCurator<T extends { status: string; date: Date }>(events: T[]) {
  const now = new Date();

  return [...events].sort((a, b) => {
    const moderationDiff = Number(b.status === "needs_review") - Number(a.status === "needs_review");

    if (moderationDiff !== 0) {
      return moderationDiff;
    }

    const aFuture = a.date >= now;
    const bFuture = b.date >= now;

    if (aFuture !== bFuture) {
      return aFuture ? -1 : 1;
    }

    return a.date.getTime() - b.date.getTime();
  });
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const user = await requireUser();
  const canManage = canManageEvents(user.role);
  const currentStatus = (await searchParams)?.status ?? "all";

  if (!canManage) {
    const students = await getDashboardData(user);

    return (
      <>
        <header className="page-header">
          <div>
            <p className="eyebrow">Карта мероприятий</p>
            <h1 className="page-title">Назначенные профпробы</h1>
            <p className="page-description">
              Здесь показаны мероприятия, которые куратор уже включил в карту. После участия можно заполнить обратную связь.
            </p>
          </div>
          <Link className="button primary" href="/feedback">
            Оставить обратную связь
          </Link>
        </header>

        <div className="grid">
          {students.length > 0 ? (
            students.map((student) => (
              <section className="section" key={student.id}>
                <h2 className="section-title">{student.name}</h2>
                <EventMapTimeline
                  rows={student.eventMap}
                  emptyText="Пока нет назначенных мероприятий."
                  showStatusControls
                  curatorName={student.curatorName}
                  priorityFirst
                />
              </section>
            ))
          ) : (
            <div className="empty-state">Пока нет назначенных мероприятий.</div>
          )}
        </div>
      </>
    );
  }

  const [events, approvedEvents, students] = await Promise.all([getEvents(), getApprovedEvents(), getStudentsForForms(user)]);
  const visibleEvents = sortEventsForCurator(
    currentStatus === "all" ? events : events.filter((event) => event.status === currentStatus)
  );

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">База мероприятий</p>
          <h1 className="page-title">События и профпробы</h1>
          <p className="page-description">
            Управленческий экран куратора: сначала события на согласование, затем ближайшие по дате. Ниже можно вручную назначить мероприятие конкретному ученику.
          </p>
        </div>
        <div className="toolbar">
          <Link className="button" href="/events/sources">
            <RadioTower size={17} aria-hidden="true" />
            Источники
          </Link>
          <Link className="button primary" href="/events/new">
            <Plus size={17} aria-hidden="true" />
            Добавить событие
          </Link>
        </div>
      </header>

      <nav className="tabs" aria-label="Статусы модерации мероприятий">
        {moderationTabs.map(([status, label]) => (
          <Link className={`tab-link ${currentStatus === status ? "active" : ""}`} href={status === "all" ? "/events" : `/events?status=${status}`} key={status}>
            {label}
          </Link>
        ))}
      </nav>

      <AssignEventForm students={students} events={approvedEvents} />

      <section className="section">
        <h2 className="section-title">Мероприятия на согласование и ближайшие даты</h2>
        <EventTable rows={visibleEvents.map((event) => ({ event }))} showModerationActions />
      </section>

      <section className="section">
        <h2 className="section-title">Календарь мероприятий</h2>
        <EventMapTimeline rows={visibleEvents.map((event) => ({ event }))} />
      </section>
    </>
  );
}
