import { signOut } from "@/auth";

type UserBarProps = {
  user: {
    name?: string | null;
    email?: string | null;
    role: string;
  };
};

const roleLabels: Record<string, string> = {
  ADMIN: "Администратор",
  CURATOR: "Педагог",
  STUDENT: "Ученик",
  PARENT: "Родитель"
};

export function UserBar({ user }: UserBarProps) {
  return (
    <div className="user-bar">
      <div>
        <strong>{user.name ?? user.email}</strong>
        <span>{roleLabels[user.role] ?? user.role}</span>
      </div>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <button className="button" type="submit">
          Выйти
        </button>
      </form>
    </div>
  );
}
