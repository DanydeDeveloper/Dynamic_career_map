import Link from "next/link";
import { Plus } from "lucide-react";
import { AssignEventForm } from "@/components/forms/AssignEventForm";
import { EventTable } from "@/components/events/EventTable";
import { getEvents, getStudentsForForms } from "@/lib/data";
import { canManageEvents, requireUser } from "@/lib/authz";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const user = await requireUser();
  const [events, students] = await Promise.all([getEvents(), getStudentsForForms(user)]);

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">База мероприятий</p>
          <h1 className="page-title">События и профпробы</h1>
          <p className="page-description">
            В MVP события добавляются вручную. Позже сюда можно подключить еженедельный сбор из источников и
            модерацию администратором.
          </p>
        </div>
        {canManageEvents(user.role) ? (
          <Link className="button primary" href="/events/new">
            <Plus size={17} aria-hidden="true" />
            Добавить событие
          </Link>
        ) : null}
      </header>

      <EventTable rows={events.map((event) => ({ event }))} />

      {canManageEvents(user.role) ? <AssignEventForm students={students} events={events} /> : null}
    </>
  );
}
