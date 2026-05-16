import Link from "next/link";
import { NewStudentForm } from "@/components/forms/NewStudentForm";
import { getStudentsForForms } from "@/lib/data";

export default async function DiagnosticsPage() {
  const students = await getStudentsForForms();

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
      </section>
    </>
  );
}
