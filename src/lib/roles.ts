export type AppRole = "ADMIN" | "CURATOR" | "PARENT" | "STUDENT";

export const roleLabels: Record<AppRole, string> = {
  ADMIN: "Администратор",
  CURATOR: "Куратор",
  PARENT: "Родитель",
  STUDENT: "Ученик"
};

export function isAppRole(role: string): role is AppRole {
  return role === "ADMIN" || role === "CURATOR" || role === "PARENT" || role === "STUDENT";
}

export function roleLabel(role: string) {
  return isAppRole(role) ? roleLabels[role] : role;
}
