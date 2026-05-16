import Link from "next/link";
import { Plus } from "lucide-react";
import { EventTable } from "@/components/events/EventTable";
import { getEvents } from "@/lib/data";

export default async function EventsPage() {
  const events = await getEvents();

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
        <Link className="button primary" href="/events/new">
          <Plus size={17} aria-hidden="true" />
          Добавить событие
        </Link>
      </header>

      <EventTable rows={events.map((event) => ({ event }))} />
    </>
  );
}
