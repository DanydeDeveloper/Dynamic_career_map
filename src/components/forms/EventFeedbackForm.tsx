import { submitFeedbackAction } from "@/app/actions";
import { SubmitButton } from "@/components/forms/SubmitButton";

type EventFeedbackFormProps = {
  students: Array<{ id: string; name: string; grade: string }>;
  events: Array<{ id: string; title: string; city: string }>;
};

const feedbackTags = [
  "люди",
  "техника",
  "творчество",
  "исследования",
  "выступления",
  "задачи",
  "помощь другим",
  "создание продукта"
];

export function EventFeedbackForm({ students, events }: EventFeedbackFormProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2 className="panel-title">Обратная связь после мероприятия</h2>
      </div>
      <form action={submitFeedbackAction} className="panel-body form-grid">
        <div className="field">
          <label htmlFor="studentId">Ученик</label>
          <select id="studentId" name="studentId" required>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name} · {student.grade}
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
          <label htmlFor="interestScore">Интерес, 1-10</label>
          <input id="interestScore" name="interestScore" type="number" min="1" max="10" defaultValue="5" />
        </div>

        <div className="field">
          <label htmlFor="difficultyScore">Сложность, 1-10</label>
          <input id="difficultyScore" name="difficultyScore" type="number" min="1" max="10" defaultValue="5" />
        </div>

        <div className="field">
          <label htmlFor="engagementScore">Вовлеченность, 1-10</label>
          <input id="engagementScore" name="engagementScore" type="number" min="1" max="10" defaultValue="5" />
        </div>

        <div className="field">
          <label htmlFor="fatigueScore">Усталость, 1-10</label>
          <input id="fatigueScore" name="fatigueScore" type="number" min="1" max="10" defaultValue="5" />
        </div>

        <div className="field full">
          <label htmlFor="wantContinue">Хочет продолжать?</label>
          <select id="wantContinue" name="wantContinue">
            <option value="yes">Да</option>
            <option value="not_sure">Не уверен</option>
            <option value="no">Нет</option>
          </select>
        </div>

        <div className="field full">
          <label htmlFor="liked">Что понравилось?</label>
          <textarea id="liked" name="liked" />
        </div>

        <div className="field full">
          <label htmlFor="disliked">Что не понравилось?</label>
          <textarea id="disliked" name="disliked" />
        </div>

        <div className="field full">
          <label htmlFor="learned">Что нового узнал?</label>
          <textarea id="learned" name="learned" />
        </div>

        <div className="field full">
          <label htmlFor="wantTryNext">Что хочется попробовать дальше?</label>
          <textarea id="wantTryNext" name="wantTryNext" />
        </div>

        <div className="field full">
          <label>Что было в мероприятии</label>
          <div className="checkbox-grid">
            {feedbackTags.map((tag) => (
              <label key={tag}>
                <input name="tags" type="checkbox" value={tag} />
                <span>{tag}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="field full">
          <SubmitButton pendingText="Создаем предложения...">Создать предложение изменений</SubmitButton>
        </div>
      </form>
    </section>
  );
}
