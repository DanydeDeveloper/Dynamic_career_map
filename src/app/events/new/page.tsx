import { createEventAction } from "@/app/actions";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { eventStatusLabels, eventTypeLabels, professionalAreas, russianCities } from "@/lib/constants";
import { getEventSources } from "@/lib/data";
import { canManageEvents, requireUser } from "@/lib/authz";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NewEventPage() {
  const user = await requireUser();

  if (!canManageEvents(user.role)) {
    notFound();
  }

  const sources = await getEventSources();

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Новое мероприятие</p>
          <h1 className="page-title">Ручное добавление события</h1>
          <p className="page-description">
            Добавьте событие как черновик, отправьте на модерацию или сразу одобрите, если качество уже проверено.
          </p>
        </div>
      </header>

      <section className="panel">
        <form action={createEventAction} className="panel-body form-grid">
          <div className="field full">
            <label htmlFor="title">Название</label>
            <input id="title" name="title" required placeholder="Инженерный мастер-класс..." />
          </div>
          <div className="field">
            <label htmlFor="date">Дата</label>
            <input id="date" name="date" required type="date" />
          </div>
          <div className="field">
            <label htmlFor="time">Время</label>
            <input id="time" name="time" type="time" />
          </div>
          <div className="field">
            <label htmlFor="city">Город</label>
            <select id="city" name="city">
              {russianCities.map((city) => (
                <option key={city}>{city}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="format">Формат</label>
            <select id="format" name="format">
              <option value="offline">Очно</option>
              <option value="online">Онлайн</option>
              <option value="hybrid">Гибрид</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="participationFormat">Формат участия</label>
            <select id="participationFormat" name="participationFormat">
              <option value="individual">Индивидуально</option>
              <option value="team">Командно</option>
              <option value="family">С семьей</option>
              <option value="with_curator">С куратором</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="eventType">Тип события</label>
            <select id="eventType" name="eventType">
              {Object.entries(eventTypeLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="ageMin">Возраст от</label>
            <input id="ageMin" name="ageMin" type="number" min="5" max="18" />
          </div>
          <div className="field">
            <label htmlFor="ageMax">Возраст до</label>
            <input id="ageMax" name="ageMax" type="number" min="5" max="18" />
          </div>
          <div className="field">
            <label htmlFor="cost">Стоимость</label>
            <input id="cost" name="cost" type="number" min="0" />
          </div>
          <div className="field full">
            <label>Профессиональные области</label>
            <div className="checkbox-grid">
              {professionalAreas.map((area) => (
                <label key={area.key}>
                  <input name="professionalAreas" type="checkbox" value={area.key} />
                  <span>{area.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="field full">
            <label>Форматы активности</label>
            <div className="checkbox-grid">
              {[
                ["teamwork", "Командная работа"],
                ["individual_work", "Индивидуальная работа"],
                ["research", "Исследование"],
                ["making", "Создание руками"],
                ["public_speaking", "Выступление"],
                ["competition", "Соревнование"],
                ["project_work", "Проект"]
              ].map(([key, label]) => (
                <label key={key}>
                  <input name="activityFormats" type="checkbox" value={key} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="field">
            <label htmlFor="status">Статус</label>
            <select id="status" name="status" defaultValue="draft">
              <option value="draft">Черновик</option>
              <option value="needs_review">На модерации</option>
              <option value="approved">{eventStatusLabels.approved}</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="sourceId">Источник из базы</label>
            <select id="sourceId" name="sourceId">
              <option value="">Без источника</option>
              {sources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.title}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="location">Место</label>
            <input id="location" name="location" placeholder="Технопарк, музей, онлайн" />
          </div>
          <div className="field full">
            <label htmlFor="sourceUrl">Источник</label>
            <input id="sourceUrl" name="sourceUrl" placeholder="https://..." />
          </div>
          <div className="field full">
            <label htmlFor="qualityNotes">Заметки модерации</label>
            <textarea id="qualityNotes" name="qualityNotes" placeholder="Что проверить: возраст, дата, стоимость, надежность источника..." />
          </div>
          <div className="field full">
            <label htmlFor="goal">Цель участия</label>
            <textarea id="goal" name="goal" placeholder="Какую гипотезу проверяет мероприятие?" />
          </div>
          <div className="field full">
            <SubmitButton pendingText="Сохраняем событие...">Сохранить событие</SubmitButton>
          </div>
        </form>
      </section>
    </>
  );
}
