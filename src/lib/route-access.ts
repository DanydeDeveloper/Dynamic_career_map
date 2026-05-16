import { type AppRole } from "@/lib/roles";

export type RouteAccessRule = {
  label: string;
  pathPrefix: string;
  roles: AppRole[];
};

export const managerRoles: AppRole[] = ["ADMIN", "CURATOR"];
export const allRoles: AppRole[] = ["ADMIN", "CURATOR", "PARENT", "STUDENT"];

export const routeAccessRules: RouteAccessRule[] = [
  { label: "Апрув", pathPrefix: "/approvals", roles: managerRoles },
  { label: "Диагностика", pathPrefix: "/diagnostics", roles: managerRoles },
  { label: "Новый ученик", pathPrefix: "/students/new", roles: managerRoles },
  { label: "Диагностика ученика", pathPrefix: "/students/:id/diagnostics", roles: managerRoles },
  { label: "Новое мероприятие", pathPrefix: "/events/new", roles: managerRoles }
];

function matchesRule(pathname: string, rule: RouteAccessRule) {
  if (rule.pathPrefix.includes(":id")) {
    const pattern = new RegExp(`^${rule.pathPrefix.replace(":id", "[^/]+")}(?:/|$)`);
    return pattern.test(pathname);
  }

  return pathname === rule.pathPrefix || pathname.startsWith(`${rule.pathPrefix}/`);
}

export function allowedRolesForPath(pathname: string) {
  return routeAccessRules.find((rule) => matchesRule(pathname, rule))?.roles ?? allRoles;
}

export function canAccessPath(role: AppRole, pathname: string) {
  return allowedRolesForPath(pathname).includes(role);
}
