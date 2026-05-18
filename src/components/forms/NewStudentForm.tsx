import { createStudentAction } from "@/app/actions";
import { FormPendingNotice, SubmitButton } from "@/components/forms/SubmitButton";
import { russianCities } from "@/lib/constants";

export function NewStudentForm() {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2 className="panel-title">Новый ученик</h2>
      </div>
      <form action={createStudentAction} className="panel-body form-grid">
        <div className="field">
          <label htmlFor="name">Имя и фамилия</label>
          <input id="name" name="name" required placeholder="Алиса Морозова" />
        </div>
        <div className="field">
          <label htmlFor="age">Возраст</label>
          <input id="age" name="age" required type="number" min="9" max="15" defaultValue="11" />
        </div>
        <div className="field">
          <label htmlFor="grade">Класс</label>
          <input id="grade" name="grade" required placeholder="6 класс" />
        </div>
        <div className="field">
          <label htmlFor="city">Город</label>
          <select id="city" name="city" required>
            {russianCities.map((city) => (
              <option key={city}>{city}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="school">Школа</label>
          <input id="school" name="school" placeholder="Private.Education" />
        </div>
        <div className="field">
          <label htmlFor="parentName">Родитель</label>
          <input id="parentName" name="parentName" placeholder="Имя родителя" />
        </div>
        <div className="field full">
          <label htmlFor="curatorName">Куратор</label>
          <input id="curatorName" name="curatorName" placeholder="Имя куратора" />
        </div>
        <div className="field full">
          <FormPendingNotice
            title="Создаем ученика"
            description="Сохраняем карточку и готовим переход к диагностике."
          />
          <SubmitButton pendingText="Создаем ученика...">Создать ученика и перейти к диагностике</SubmitButton>
        </div>
      </form>
    </section>
  );
}
