import Link from "next/link";
import { Plus } from "lucide-react";
import { StudentCard } from "@/components/students/StudentCard";
import { getDashboardData } from "@/lib/data";
import { canManageStudents, requireUser } from "@/lib/authz";
import { isAppRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

const pageCopy = {
  ADMIN: {
    eyebrow: "Ученики",
    title: "Все профили и карты",
    description: "Администратор видит все ученические профили, текущие карты мероприятий и статус предложений изменений."
  },
  CURATOR: {
    eyebrow: "Ученики",
    title: "Мои ученики",
    description: "Куратор видит текущие профили, ближайшие события и предложения изменений по своим ученикам."
  },
  PARENT: {
    eyebrow: "Ребенок",
    title: "Профиль и карта ребенка",
    description: "Здесь собраны характеристика, карта мероприятий, стратегия и ожидающие решения изменения."
  },
  STUDENT: {
    eyebrow: "Мой профиль",
    title: "Моя карта развития",
    description: "Профиль интересов, ближайшие мероприятия и предложения, которые куратор проверяет перед обновлением карты."
  }
};

export default async function StudentsPage() {
  const user = await requireUser();
  const students = await getDashboardData(user);
  const role = isAppRole(user.role) ? user.role : "CURATOR";
  const copy = pageCopy[role];

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1 className="page-title">{copy.title}</h1>
          <p className="page-description">{copy.description}</p>
        </div>
        {canManageStudents(user.role) ? (
          <Link className="button primary" href="/students/new">
            <Plus size={17} aria-hidden="true" />
            Новый ученик
          </Link>
        ) : null}
      </header>

      {students.length > 0 ? (
        <div className="grid two">
          {students.map((student) => (
            <StudentCard key={student.id} student={student} />
          ))}
        </div>
      ) : (
        <div className="empty-state">Пока нет профилей в доступе.</div>
      )}
    </>
  );
}
