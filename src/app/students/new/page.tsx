import { NewStudentForm } from "@/components/forms/NewStudentForm";
import { canManageStudents, requireUser } from "@/lib/authz";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NewStudentPage() {
  const user = await requireUser();

  if (!canManageStudents(user.role)) {
    notFound();
  }

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
