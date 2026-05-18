import { assignEventToStudentAction } from "@/app/actions";
import { FormPendingNotice, SubmitButton } from "@/components/forms/SubmitButton";
import { priorityLabels } from "@/lib/constants";

type AssignEventFormProps = {
  students: Array<{ id: string; name: string; grade: string; city: string }>;
  events: Array<{ id: string; title: string; city: string }>;
};

export function AssignEventForm({ students, events }: AssignEventFormProps) {
  return (
    <section className="panel section">
      <div className="panel-header">
        <h2 className="panel-title">Назначить мероприятие ученику</h2>
      </div>
      <form action={assignEventToStudentAction} className="panel-body form-grid">
        <div className="field">
          <label htmlFor="studentId">Ученик</label>
          <select id="studentId" name="studentId" required>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name} · {student.grade} · {student.city}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="eventId">Мероприятие</label>
          <select id="eventId" name="eventId" required>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title} · {event.city}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="priority">Приоритет</label>
          <select id="priority" name="priority" defaultValue="auto">
            <option value="auto">Авто по профилю</option>
            {Object.entries(priorityLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="field full">
          <label htmlFor="goalForStudent">Цель для ученика</label>
          <textarea id="goalForStudent" name="goalForStudent" placeholder="Можно оставить пустым: система предложит цель по профилю ученика." />
        </div>
        <div className="field full">
          <label htmlFor="curatorComment">Комментарий куратора</label>
          <textarea id="curatorComment" name="curatorComment" placeholder="Если оставить пустым, система добавит объяснение подбора." />
        </div>
        <div className="field full">
          <FormPendingNotice
            title="Назначаем мероприятие"
            description="Добавляем событие в карту ученика и записываем изменение в журнал."
          />
          <SubmitButton pendingText="Добавляем в карту...">Добавить в карту ученика</SubmitButton>
        </div>
      </form>
    </section>
  );
}
