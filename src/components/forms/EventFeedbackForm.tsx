export function EventFeedbackForm() {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2 className="panel-title">Фидбэк после мероприятия</h2>
      </div>
      <form className="panel-body form-grid">
        <div className="field">
          <label htmlFor="interestScore">Интерес, 1-10</label>
          <input id="interestScore" name="interestScore" type="number" min="1" max="10" />
        </div>
        <div className="field">
          <label htmlFor="difficultyScore">Сложность, 1-10</label>
          <input id="difficultyScore" name="difficultyScore" type="number" min="1" max="10" />
        </div>
        <div className="field">
          <label htmlFor="engagementScore">Вовлеченность, 1-10</label>
          <input id="engagementScore" name="engagementScore" type="number" min="1" max="10" />
        </div>
        <div className="field">
          <label htmlFor="fatigueScore">Усталость, 1-10</label>
          <input id="fatigueScore" name="fatigueScore" type="number" min="1" max="10" />
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
          <label htmlFor="wantTryNext">Что хочется попробовать дальше?</label>
          <textarea id="wantTryNext" name="wantTryNext" />
        </div>
        <div className="field full">
          <button className="button primary" type="button">
            Создать предложение изменений
          </button>
        </div>
      </form>
    </section>
  );
}
