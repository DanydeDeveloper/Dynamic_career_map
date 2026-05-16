import { professionalAreas, russianCities } from "@/lib/constants";

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
        <form className="panel-body form-grid">
          <div className="field full">
            <label htmlFor="title">Название</label>
            <input id="title" name="title" placeholder="Инженерный мастер-класс..." />
          </div>
          <div className="field">
            <label htmlFor="date">Дата</label>
            <input id="date" name="date" type="date" />
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
          <div className="field">
            <label htmlFor="area">Основная область</label>
            <select id="area" name="area">
              {professionalAreas.map((area) => (
                <option key={area.key} value={area.key}>
                  {area.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field full">
            <label htmlFor="goal">Цель участия</label>
            <textarea id="goal" name="goal" placeholder="Какую гипотезу проверяет мероприятие?" />
          </div>
          <div className="field full">
            <button className="button primary" type="button">
              Сохранить событие
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
