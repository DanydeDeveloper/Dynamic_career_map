import { EventFeedbackForm } from "@/components/forms/EventFeedbackForm";

export default function FeedbackPage() {
  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Фидбэк</p>
          <h1 className="page-title">Обратная связь после мероприятия</h1>
          <p className="page-description">
            Форма собирает количественные и качественные сигналы. После отправки система должна создавать
            предложения изменений, которые педагог подтверждает отдельно.
          </p>
        </div>
      </header>

      <EventFeedbackForm />
    </>
  );
}
