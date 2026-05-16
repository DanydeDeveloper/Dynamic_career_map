import { professionalAreas } from "@/lib/constants";

export function StudentDiagnosticForm() {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2 className="panel-title">Анкета ученика</h2>
      </div>
      <form className="panel-body form-grid">
        <div className="field full">
          <label htmlFor="likedActivities">Какие занятия нравятся больше всего?</label>
          <textarea id="likedActivities" name="likedActivities" placeholder="Например: делать игры, собирать модели, решать задачи" />
        </div>
        <div className="field full">
          <label htmlFor="subjects">Какие школьные предметы интересны?</label>
          <textarea id="subjects" name="subjects" placeholder="Математика, технология, биология..." />
        </div>
        <div className="field full">
          <label htmlFor="formats">Что ближе по формату?</label>
          <select id="formats" name="formats">
            <option>Командная проектная работа</option>
            <option>Индивидуальное исследование</option>
            <option>Создание руками</option>
            <option>Публичные выступления</option>
            <option>Соревнования</option>
          </select>
        </div>
        <div className="field full">
          <label htmlFor="selfScores">Самооценка интересов</label>
          <textarea
            id="selfScores"
            name="selfScores"
            placeholder={professionalAreas.map((area) => `${area.label}: 1-10`).join("\n")}
          />
        </div>
        <div className="field full">
          <button className="button primary" type="button">
            Сохранить черновик диагностики
          </button>
        </div>
      </form>
    </section>
  );
}
