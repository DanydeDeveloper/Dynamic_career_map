import { russianCities } from "@/lib/constants";

export function ParentRequestForm() {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2 className="panel-title">Родительский запрос</h2>
      </div>
      <form className="panel-body form-grid">
        <div className="field full">
          <label htmlFor="expectations">Ожидания от профориентации</label>
          <textarea id="expectations" name="expectations" placeholder="Что семья хочет понять или проверить?" />
        </div>
        <div className="field">
          <label htmlFor="budget">Бюджет на мероприятия</label>
          <input id="budget" name="budget" type="number" min="0" placeholder="12000" />
        </div>
        <div className="field">
          <label htmlFor="city">Город / формат</label>
          <select id="city" name="city">
            {russianCities.map((city) => (
              <option key={city}>{city}</option>
            ))}
          </select>
        </div>
        <div className="field full">
          <label htmlFor="availableTime">Доступное время</label>
          <input id="availableTime" name="availableTime" placeholder="Например: суббота, будни после 18:00" />
        </div>
        <div className="field full">
          <label htmlFor="limits">Тревоги и ограничения</label>
          <textarea id="limits" name="limits" placeholder="Нагрузка, здоровье, нежелательные направления..." />
        </div>
        <div className="field full">
          <button className="button primary" type="button">
            Сохранить родительский запрос
          </button>
        </div>
      </form>
    </section>
  );
}
