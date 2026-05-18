import Link from "next/link";
import { Check, ClipboardCheck, X } from "lucide-react";
import { reviewStudentEventSelectionAction } from "@/app/actions";
import { FormPendingNotice, SubmitButton } from "@/components/forms/SubmitButton";
import { eventTypeLabels, formatLabels } from "@/lib/constants";
import { formatDate } from "@/lib/format";

type StudentEventSelectionCardProps = {
  selection: {
    id: string;
    createdAt: Date;
    goalForStudent: string;
    student: {
      id: string;
      name: string;
      grade: string;
      city: string;
    };
    event: {
      title: string;
      date: Date;
      time: string;
      format: string;
      eventType: string;
      city: string;
    };
  };
};

export function StudentEventSelectionCard({ selection }: StudentEventSelectionCardProps) {
  return (
    <article className="proposal-card">
      <div className="student-card-top">
        <div>
          <span className="tag warning">Выбор ученика</span>
          <span className="tag accent">Ждет решения куратора</span>
          <h2 className="student-name">{selection.event.title}</h2>
        </div>
        <ClipboardCheck size={22} aria-hidden="true" />
      </div>

      <p className="muted">
        <Link href={`/students/${selection.student.id}`}>{selection.student.name}</Link> · {selection.student.grade} ·{" "}
        {selection.student.city}
      </p>
      <p className="muted">
        {formatDate(selection.event.date)} · {selection.event.time} ·{" "}
        {eventTypeLabels[selection.event.eventType] ?? selection.event.eventType} ·{" "}
        {formatLabels[selection.event.format] ?? selection.event.format} · {selection.event.city}
      </p>
      <p>{selection.goalForStudent}</p>
      <p className="muted">Выбрано: {formatDate(selection.createdAt)}</p>

      <div className="proposal-actions">
        <form action={reviewStudentEventSelectionAction}>
          <input name="studentEventMapId" type="hidden" value={selection.id} />
          <input name="decision" type="hidden" value="approved" />
          <FormPendingNotice
            title="Согласуем выбор"
            description="Мероприятие станет рекомендацией к посещению в карте ученика."
          />
          <SubmitButton pendingText="Согласуем...">
            <Check size={16} aria-hidden="true" />
            Одобрить выбор
          </SubmitButton>
        </form>

        <form action={reviewStudentEventSelectionAction}>
          <input name="studentEventMapId" type="hidden" value={selection.id} />
          <input name="decision" type="hidden" value="rejected" />
          <FormPendingNotice
            title="Отклоняем выбор"
            description="Мероприятие уйдет из карты ученика, решение останется в журнале."
          />
          <SubmitButton className="button" pendingText="Отклоняем...">
            <X size={16} aria-hidden="true" />
            Отклонить
          </SubmitButton>
        </form>
      </div>
    </article>
  );
}
