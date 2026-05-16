import { Sidebar } from "@/components/layout/Sidebar";
import { UserBar } from "@/components/layout/UserBar";
import { auth } from "@/auth";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
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
