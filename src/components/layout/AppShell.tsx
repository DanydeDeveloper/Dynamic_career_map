import { Sidebar } from "@/components/layout/Sidebar";
import { UserBar } from "@/components/layout/UserBar";
import { auth } from "@/auth";
import { headers } from "next/headers";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const pathname = (await headers()).get("x-pathname") ?? "";

  if (!session?.user || pathname === "/" || pathname.startsWith("/login")) {
    return <main className="main login-main">{children}</main>;
  }

  return (
    <div className="app-shell">
      <Sidebar role={session.user.role} />
      <main className="main">
        <UserBar user={session.user} />
        {children}
      </main>
    </div>
  );
}
