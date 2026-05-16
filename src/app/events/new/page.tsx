import { createEventAction } from "@/app/actions";
import { eventTypeLabels, professionalAreas, russianCities } from "@/lib/constants";

export default function NewEventPage() {
  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Новое мероприятие</p>
          <h1 className="page-title">Ручное добавление события</h1>
          <p className="page-description">
            Это форма первого этапа. Она задает нужную структуру события, а сохранение в базу подключим следующим
            проходом вместе с модерацией.
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
            <select id="status" name="status">
              <option value="draft">Черновик</option>
              <option value="approved">Одобрено</option>
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
            <label htmlFor="goal">Цель участия</label>
            <textarea id="goal" name="goal" placeholder="Какую гипотезу проверяет мероприятие?" />
          </div>
          <div className="field full">
            <button className="button primary" type="submit">
              Сохранить событие
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
