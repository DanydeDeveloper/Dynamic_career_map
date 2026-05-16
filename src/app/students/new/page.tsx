import { NewStudentForm } from "@/components/forms/NewStudentForm";

export default function NewStudentPage() {
  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Новый ученик</p>
          <h1 className="page-title">Создание профиля</h1>
          <p className="page-description">
            Сначала создаем базовую карточку ученика. После сохранения откроется диагностика, где можно заполнить
            интересы, склонности и родительский запрос.
          </p>
        </div>
      </header>

      <NewStudentForm />
    </>
  );
}
