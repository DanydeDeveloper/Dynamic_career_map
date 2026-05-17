import { createEventSourceAction } from "@/app/actions";
import { professionalAreas, russianCities } from "@/lib/constants";
import { FormPendingNotice, SubmitButton } from "@/components/forms/SubmitButton";

export function EventSourceForm() {
  return (
    <section className="panel section">
      <div className="panel-header">
        <h2 className="panel-title">Новый источник мероприятий</h2>
      </div>
      <form action={createEventSourceAction} className="panel-body form-grid">
        <div className="field">
          <label htmlFor="title">Название источника</label>
          <input id="title" name="title" required placeholder="Технопарк, музей, олимпиадная платформа" />
        </div>
        <div className="field">
          <label htmlFor="url">URL</label>
          <input id="url" name="url" required placeholder="https://..." />
        </div>
        <div className="field">
          <label htmlFor="city">Город</label>
          <select id="city" name="city">
            <option value="">Любой / онлайн</option>
            {russianCities.map((city) => (
              <option key={city}>{city}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="isActive">Статус</label>
          <select id="isActive" name="isActive" defaultValue="on">
            <option value="on">Активен</option>
            <option value="off">Не активен</option>
          </select>
        </div>
        <div className="field full">
          <label>Тематика</label>
          <div className="checkbox-grid">
            {professionalAreas.map((area) => (
              <label key={area.key}>
                <input name="focusAreas" type="checkbox" value={area.key} />
                <span>{area.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="field full">
          <label htmlFor="comment">Комментарий</label>
          <textarea id="comment" name="comment" placeholder="Что и как часто стоит отсматривать у этого источника?" />
        </div>
        <div className="field full">
          <FormPendingNotice
            title="Источник сохраняется"
            description="Добавляем источник в базу и обновляем список источников мероприятий."
          />
          <SubmitButton pendingText="Добавляем источник...">Добавить источник</SubmitButton>
        </div>
      </form>
    </section>
  );
}
