import { notFound } from "next/navigation";
import { getStudentProfile } from "@/lib/data";
import { prisma } from "@/lib/db";
import { StudentDiagnosticForm } from "@/components/forms/StudentDiagnosticForm";
import { ParentRequestForm } from "@/components/forms/ParentRequestForm";

type DiagnosticsPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamicParams = false;

export async function generateStaticParams() {
  const students = await prisma.student.findMany({
    select: { id: true }
  });

  return students.map((student) => ({ id: student.id }));
}

export default async function StudentDiagnosticsPage({ params }: DiagnosticsPageProps) {
  const { id } = await params;
  const student = await getStudentProfile(id);

  if (!student) {
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
        <StudentDiagnosticForm />
        <ParentRequestForm />
      </div>
    </>
  );
}
