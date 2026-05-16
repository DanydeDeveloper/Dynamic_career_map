"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ClipboardCheck,
  LayoutDashboard,
  ListChecks,
  MessageSquareText,
  UsersRound
} from "lucide-react";
import { type AppRole, isAppRole, roleLabel } from "@/lib/roles";
import { allRoles, managerRoles } from "@/lib/route-access";

type SidebarProps = {
  role: string;
};

type NavItem = {
  href: string;
  label: string | Partial<Record<AppRole, string>>;
  icon: typeof LayoutDashboard;
  roles: AppRole[];
};

const navItems: NavItem[] = [
  { href: "/", label: "Кабинет", icon: LayoutDashboard, roles: allRoles },
  {
    href: "/students",
    label: {
      ADMIN: "Ученики",
      CURATOR: "Ученики",
      PARENT: "Ребенок",
      STUDENT: "Мой профиль"
    },
    icon: UsersRound,
    roles: allRoles
  },
  {
    href: "/events",
    label: {
      ADMIN: "Мероприятия",
      CURATOR: "Мероприятия",
      PARENT: "Карта мероприятий",
      STUDENT: "Карта мероприятий"
    },
    icon: CalendarDays,
    roles: allRoles
  },
  { href: "/feedback", label: "Фидбэк", icon: MessageSquareText, roles: allRoles },
  { href: "/approvals", label: "Апрув", icon: ClipboardCheck, roles: managerRoles },
  { href: "/diagnostics", label: "Диагностика", icon: ListChecks, roles: managerRoles }
];

const roleNotes: Record<AppRole, string> = {
  ADMIN: "Полный контур продукта: ученики, мероприятия, предложения изменений и контроль рабочих процессов.",
  CURATOR: "Педагог ведет диагностику, карту мероприятий, фидбэк и подтверждает изменения перед обновлением профиля.",
  PARENT: "Родитель видит профиль ребенка, назначенные мероприятия и может оставить обратную связь после участия.",
  STUDENT: "Ученик видит свою карту, ближайшие пробы и может заполнить впечатления после мероприятия."
};

function getItemLabel(item: NavItem, role: AppRole) {
  if (typeof item.label === "string") {
    return item.label;
  }

  return item.label[role] ?? item.label.CURATOR ?? item.href;
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const appRole = isAppRole(role) ? role : "CURATOR";
  const visibleItems = navItems.filter((item) => item.roles.includes(appRole));

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">DC</div>
        <div>
          <h1 className="brand-title">Dynamic Career Map</h1>
          <p className="brand-subtitle">Private.Education</p>
        </div>
      </div>

      <div className="role-pill">{roleLabel(appRole)}</div>

      <nav className="nav-list" aria-label="Главная навигация">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link key={item.href} className={`nav-link ${isActive ? "active" : ""}`} href={item.href}>
              <Icon size={18} aria-hidden="true" />
              <span>{getItemLabel(item, appRole)}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-note">{roleNotes[appRole]}</div>
    </aside>
  );
}
