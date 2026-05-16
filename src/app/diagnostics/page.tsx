import Link from "next/link";
import { notFound } from "next/navigation";
import { NewStudentForm } from "@/components/forms/NewStudentForm";
import { getStudentsForForms } from "@/lib/data";
import { canManageStudents, requireUser } from "@/lib/authz";

export const dynamic = "force-dynamic";

export default async function DiagnosticsPage() {
  const user = await requireUser();

  if (!canManageStudents(user.role)) {
    notFound();
  }

  const students = await getStudentsForForms(user);

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Диагностика</p>
          <h1 className="page-title">Первичный сбор данных</h1>
          <p className="page-description">
            Создайте ученика, затем заполните анкету ребенка и отдельный родительский запрос в его профиле.
          </p>
        </div>
      </header>

      <NewStudentForm />

      <section className="section">
        <h2 className="section-title">Продолжить диагностику существующего ученика</h2>
        {students.length > 0 ? (
          <div className="grid two">
            {students.map((student) => (
              <Link className="student-card" href={`/students/${student.id}/diagnostics`} key={student.id}>
                <h3 className="student-name">{student.name}</h3>
                <p className="muted">
                  {student.grade} · {student.city}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state">Пока нет учеников для диагностики.</div>
        )}
      </section>
    </>
  );
}
