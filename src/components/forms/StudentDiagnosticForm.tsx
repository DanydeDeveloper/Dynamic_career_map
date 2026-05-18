import { saveStudentDiagnosticAction } from "@/app/actions";
import { FormPendingNotice, SubmitButton } from "@/components/forms/SubmitButton";
import { professionalAreas } from "@/lib/constants";

export function StudentDiagnosticForm({ studentId }: { studentId: string }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2 className="panel-title">Анкета ученика</h2>
      </div>
      <form action={saveStudentDiagnosticAction} className="panel-body form-grid">
        <input name="studentId" type="hidden" value={studentId} />
        <div className="field full">
          <label htmlFor="likedActivities">Какие занятия нравятся больше всего?</label>
          <textarea id="likedActivities" name="likedActivities" placeholder="Например: делать игры, собирать модели, решать задачи" />
        </div>
        <div className="field full">
          <label htmlFor="subjects">Какие школьные предметы интересны?</label>
          <textarea id="subjects" name="subjects" placeholder="Математика, технология, биология..." />
        </div>
        <div className="field full">
          <label htmlFor="experience">Образовательный опыт</label>
          <textarea id="experience" name="experience" placeholder="Кружки, олимпиады, проекты, мероприятия, что понравилось и не понравилось" />
        </div>
        <div className="field full">
          <label>Самооценка интересов по областям</label>
          <div className="score-grid">
            {professionalAreas.map((area) => (
              <label className="score-field" key={area.key}>
                <span>{area.label}</span>
                <input name={`interest_${area.key}`} type="number" min="1" max="10" defaultValue="5" />
              </label>
            ))}
          </div>
        </div>
        <div className="field full">
          <label>Склонности</label>
          <div className="score-grid compact">
            <label className="score-field">
              <span>Аналитика</span>
              <input name="analytical_thinking" type="number" min="1" max="10" defaultValue="5" />
            </label>
            <label className="score-field">
              <span>Креативность</span>
              <input name="creative_thinking" type="number" min="1" max="10" defaultValue="5" />
            </label>
            <label className="score-field">
              <span>Коммуникация</span>
              <input name="communication" type="number" min="1" max="10" defaultValue="5" />
            </label>
            <label className="score-field">
              <span>Исследование</span>
              <input name="research_orientation" type="number" min="1" max="10" defaultValue="5" />
            </label>
            <label className="score-field">
              <span>Создание руками</span>
              <input name="practical_making" type="number" min="1" max="10" defaultValue="5" />
            </label>
          </div>
        </div>
        <div className="field full">
          <label>Форматы деятельности</label>
          <div className="score-grid compact">
            <label className="score-field">
              <span>Команда</span>
              <input name="teamwork" type="number" min="1" max="10" defaultValue="5" />
            </label>
            <label className="score-field">
              <span>Индивидуально</span>
              <input name="individual_work" type="number" min="1" max="10" defaultValue="5" />
            </label>
            <label className="score-field">
              <span>Соревнование</span>
              <input name="competition" type="number" min="1" max="10" defaultValue="5" />
            </label>
            <label className="score-field">
              <span>Проект</span>
              <input name="project_work" type="number" min="1" max="10" defaultValue="5" />
            </label>
            <label className="score-field">
              <span>Выступления</span>
              <input name="public_speaking" type="number" min="1" max="10" defaultValue="5" />
            </label>
          </div>
        </div>
        <div className="field full">
          <label htmlFor="summaryText">Черновик характеристики</label>
          <textarea id="summaryText" name="summaryText" placeholder="Можно оставить пустым: система соберет базовый текст сама" />
        </div>
        <div className="field full">
          <label htmlFor="curatorComment">Комментарий куратора</label>
          <textarea id="curatorComment" name="curatorComment" />
        </div>
        <div className="field full">
          <FormPendingNotice
            title="Диагностика обрабатывается"
            description="Генерируем черновик через Claude или fallback, сохраняем диагностику, профиль, стратегию, журнал и снимки."
          />
          <SubmitButton pendingText="Генерируем и сохраняем...">Сохранить диагностику и обновить профиль</SubmitButton>
        </div>
      </form>
    </section>
  );
}
