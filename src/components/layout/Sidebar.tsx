"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ClipboardCheck, LayoutDashboard, ListChecks, MessageSquareText, UsersRound } from "lucide-react";

const navItems = [
  { href: "/", label: "Панель", icon: LayoutDashboard },
  { href: "/students", label: "Ученики", icon: UsersRound },
  { href: "/events", label: "Мероприятия", icon: CalendarDays },
  { href: "/feedback", label: "Фидбэк", icon: MessageSquareText },
  { href: "/approvals", label: "Апрув", icon: ClipboardCheck },
  { href: "/diagnostics", label: "Диагностика", icon: ListChecks }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">DC</div>
        <div>
          <h1 className="brand-title">Dynamic Career Map</h1>
          <p className="brand-subtitle">Private.Education</p>
        </div>
      </div>

      <nav className="nav-list" aria-label="Главная навигация">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link key={item.href} className={`nav-link ${isActive ? "active" : ""}`} href={item.href}>
              <Icon size={18} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-note">
        MVP без авторизации. Все решения системы проходят через педагога: предложения не меняют профиль без апрува.
      </div>
    </aside>
  );
}
