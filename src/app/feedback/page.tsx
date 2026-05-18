import { EventFeedbackForm } from "@/components/forms/EventFeedbackForm";
import { getDashboardData, getEvents, getStudentsForForms } from "@/lib/data";
import { canManageEvents, requireUser } from "@/lib/authz";

export const dynamic = "force-dynamic";

type FeedbackPageProps = {
  searchParams?: Promise<{
    studentId?: string;
    eventId?: string;
  }>;
};

function uniqueEvents(
  students: Awaited<ReturnType<typeof getDashboardData>>
): Array<{ id: string; title: string; city: string }> {
  const seen = new Set<string>();
  return students
    .flatMap((student) => student.eventMap.map((map) => map.event))
    .filter((event) => {
      if (seen.has(event.id)) {
        return false;
      }
      seen.add(event.id);
      return true;
    });
}

export default async function FeedbackPage({ searchParams }: FeedbackPageProps) {
  const user = await requireUser();
  const params = await searchParams;
  const students = await getStudentsForForms(user);
  const events = canManageEvents(user.role) ? await getEvents() : uniqueEvents(await getDashboardData(user));

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Обратная связь</p>
          <h1 className="page-title">Обратная связь после мероприятия</h1>
          <p className="page-description">
            Форма собирает впечатления после профпробы. На основе обратной связи система создает предложения изменений, а
            куратор отдельно подтверждает, что попадет в профиль и карту.
          </p>
        </div>
      </header>

      {students.length > 0 && events.length > 0 ? (
        <EventFeedbackForm
          students={students}
          events={events}
          defaultStudentId={params?.studentId}
          defaultEventId={params?.eventId}
        />
      ) : (
        <div className="empty-state">Пока нет доступных учеников или назначенных мероприятий для обратной связи.</div>
      )}
    </>
  );
}
