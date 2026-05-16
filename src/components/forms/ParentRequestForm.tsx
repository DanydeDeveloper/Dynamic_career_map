import { saveParentRequestAction } from "@/app/actions";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { professionalAreas } from "@/lib/constants";

export function ParentRequestForm({ studentId }: { studentId: string }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2 className="panel-title">Родительский запрос</h2>
      </div>
      <form action={saveParentRequestAction} className="panel-body form-grid">
        <input name="studentId" type="hidden" value={studentId} />
        <div className="field full">
          <label htmlFor="expectations">Ожидания от профориентации</label>
          <textarea id="expectations" name="expectations" required placeholder="Что семья хочет понять или проверить?" />
        </div>
        <div className="field">
          <label htmlFor="budget">Бюджет на мероприятия</label>
          <input id="budget" name="budget" type="number" min="0" placeholder="12000" />
        </div>
        <div className="field full">
          <label htmlFor="availableTime">Доступное время</label>
          <input id="availableTime" name="availableTime" placeholder="Например: суббота, будни после 18:00" />
        </div>
        <div className="field full">
          <label>Направления, которые родитель хочет проверить</label>
          <div className="checkbox-grid">
            {professionalAreas.map((area) => (
              <label key={area.key}>
                <input name="preferredAreas" type="checkbox" value={area.key} />
                <span>{area.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="field full">
          <label>Направления, которые пока не рассматриваются</label>
          <div className="checkbox-grid">
            {professionalAreas.map((area) => (
              <label key={area.key}>
                <input name="restrictedAreas" type="checkbox" value={area.key} />
                <span>{area.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="field full">
          <label htmlFor="comment">Тревоги и ограничения</label>
          <textarea id="comment" name="comment" placeholder="Нагрузка, здоровье, нежелательные направления..." />
        </div>
        <div className="field full">
          <SubmitButton pendingText="Сохраняем запрос...">Сохранить родительский запрос</SubmitButton>
        </div>
      </form>
    </section>
  );
}
