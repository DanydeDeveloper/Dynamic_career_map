import { notFound } from "next/navigation";
import { getStudentProfile } from "@/lib/data";
import { canManageStudents, requireUser } from "@/lib/authz";
import { StudentDiagnosticForm } from "@/components/forms/StudentDiagnosticForm";
import { ParentRequestForm } from "@/components/forms/ParentRequestForm";

type DiagnosticsPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function StudentDiagnosticsPage({ params }: DiagnosticsPageProps) {
  const { id } = await params;
  const user = await requireUser();
  const student = await getStudentProfile(id, user);

  if (!student || !canManageStudents(user.role)) {
    notFound();
  }

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Диагностика</p>
          <h1 className="page-title">{student.name}</h1>
          <p className="page-description">
            Формы фиксируют интересы ребенка и отдельный родительский запрос. В MVP данные можно уточнить
            вручную перед генерацией характеристики.
          </p>
        </div>
      </header>

      <div className="grid two">
        <StudentDiagnosticForm studentId={student.id} />
        <ParentRequestForm studentId={student.id} />
      </div>
    </>
  );
}
