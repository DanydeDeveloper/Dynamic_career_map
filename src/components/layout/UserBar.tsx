import { signOut } from "@/auth";
import { FormPendingNotice, SubmitButton } from "@/components/forms/SubmitButton";
import { roleLabel } from "@/lib/roles";

type UserBarProps = {
  user: {
    name?: string | null;
    email?: string | null;
    role: string;
  };
};

export function UserBar({ user }: UserBarProps) {
  return (
    <div className="user-bar">
      <div>
        <strong>{user.name ?? user.email}</strong>
        <span>{roleLabel(user.role)}</span>
      </div>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <FormPendingNotice title="Выходим" description="Завершаем сессию и возвращаемся на страницу входа." />
        <SubmitButton className="button" pendingText="Выходим...">
          Выйти
        </SubmitButton>
      </form>
    </div>
  );
}
