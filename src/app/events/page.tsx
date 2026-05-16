import Link from "next/link";
import { Plus } from "lucide-react";
import { AssignEventForm } from "@/components/forms/AssignEventForm";
import { EventMapTimeline } from "@/components/events/EventMapTimeline";
import { EventTable } from "@/components/events/EventTable";
import { getDashboardData, getEvents, getStudentsForForms } from "@/lib/data";
import { canManageEvents, requireUser } from "@/lib/authz";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const user = await requireUser();
  const canManage = canManageEvents(user.role);

  if (!canManage) {
    const students = await getDashboardData(user);

    return (
      <>
        <header className="page-header">
          <div>
            <p className="eyebrow">Карта мероприятий</p>
            <h1 className="page-title">Назначенные профпробы</h1>
            <p className="page-description">
              Здесь показаны мероприятия, которые педагог уже включил в карту. После участия можно заполнить обратную связь.
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
                <EventMapTimeline rows={student.eventMap} emptyText="Пока нет назначенных мероприятий." showStatusControls />
              </section>
            ))
          ) : (
            <div className="empty-state">Пока нет назначенных мероприятий.</div>
          )}
        </div>
      </>
    );
  }

  const [events, students] = await Promise.all([getEvents(), getStudentsForForms(user)]);

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">База мероприятий</p>
          <h1 className="page-title">События и профпробы</h1>
          <p className="page-description">
            Управленческий экран педагога: база событий, ручное добавление и назначение мероприятий ученикам.
          </p>
        </div>
        <Link className="button primary" href="/events/new">
          <Plus size={17} aria-hidden="true" />
          Добавить событие
        </Link>
      </header>

      <section className="section">
        <h2 className="section-title">Календарь базы мероприятий</h2>
        <EventMapTimeline rows={events.map((event) => ({ event }))} />
      </section>

      <section className="section">
        <h2 className="section-title">Таблица событий</h2>
        <EventTable rows={events.map((event) => ({ event }))} />
      </section>

      <AssignEventForm students={students} events={events} />
    </>
  );
}
