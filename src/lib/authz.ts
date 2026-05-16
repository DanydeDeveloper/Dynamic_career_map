import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function requireUser() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return session.user;
}

export function canManageApprovals(role: string) {
  return role === "ADMIN" || role === "CURATOR";
}

export function canManageEvents(role: string) {
  return role === "ADMIN" || role === "CURATOR";
}

export function canManageStudents(role: string) {
  return role === "ADMIN" || role === "CURATOR";
}
