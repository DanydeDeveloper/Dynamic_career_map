import Link from "next/link";
import { Plus } from "lucide-react";
import { StudentCard } from "@/components/students/StudentCard";
import { getDashboardData } from "@/lib/data";

export default async function StudentsPage() {
  const students = await getDashboardData();

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Ученики</p>
          <h1 className="page-title">Профили и карты</h1>
          <p className="page-description">
            Здесь педагог видит текущие профили, ближайшие события и статус предложений по каждому ребенку.
          </p>
        </div>
        <Link className="button primary" href="/students/new">
          <Plus size={17} aria-hidden="true" />
          Новый ученик
        </Link>
      </header>

      <div className="grid two">
        {students.map((student) => (
          <StudentCard key={student.id} student={student} />
        ))}
      </div>
    </>
  );
}
