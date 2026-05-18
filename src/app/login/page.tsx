import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { GraduationCap, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { signIn } from "@/auth";
import { SubmitButton } from "@/components/forms/SubmitButton";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

const demoProfiles = [
  {
    role: "Администратор",
    title: "Администратор",
    email: "admin@private.education",
    description: "Полный доступ: ученики, мероприятия, источники, модерация и согласования.",
    icon: ShieldCheck
  },
  {
    role: "Куратор",
    title: "Куратор",
    email: "curator@private.education",
    description: "Диагностика, подбор мероприятий, обратная связь и согласование изменений.",
    icon: GraduationCap
  },
  {
    role: "Родитель",
    title: "Родитель",
    email: "parent@example.com",
    description: "Просмотр карты ребенка и отправка обратной связи после мероприятий.",
    icon: UsersRound
  },
  {
    role: "Ученик",
    title: "Ученик",
    email: "student@example.com",
    description: "Личный профиль, карта мероприятий и впечатления после профпроб.",
    icon: UserRound
  }
];

async function loginAction(formData: FormData) {
  "use server";

  const email = String(formData.get("loginEmail") ?? formData.get("selectedEmail") ?? "").trim();

  try {
    await signIn("credentials", {
      email,
      password: "password123",
      redirectTo: "/dashboard"
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?error=CredentialsSignin");
    }
    throw error;
  }
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <section className="login-shell">
      <div className="login-panel">
        <p className="eyebrow">Dynamic Career Map</p>
        <h1 className="page-title">Выберите профиль</h1>
        <p className="page-description">
          Откройте приложение как администратор, куратор, родитель или ученик. Демо-логин выбирается здесь, без
          ручного ввода email и пароля.
        </p>

        {params.error ? (
          <p className="form-error">Не удалось войти. Выберите профиль еще раз.</p>
        ) : null}

        <div className="profile-choice-grid">
          {demoProfiles.map((profile) => {
            const Icon = profile.icon;

            return (
              <form action={loginAction} className="profile-choice-form" key={profile.email}>
                <input name="loginEmail" type="hidden" value={profile.email} />
                <SubmitButton className="profile-choice" pendingText={`Входим как ${profile.role.toLowerCase()}...`}>
                  <Icon size={20} aria-hidden="true" />
                  <span>
                    <strong>{profile.title}</strong>
                    <small>{profile.description}</small>
                    <em>{profile.email}</em>
                  </span>
                </SubmitButton>
              </form>
            );
          })}
        </div>

        <form action={loginAction} className="profile-login-form">
          <div className="field full">
            <label htmlFor="selectedEmail">Войти через список логинов</label>
            <div className="login-select-row">
              <select id="selectedEmail" name="selectedEmail" defaultValue="curator@private.education">
                {demoProfiles.map((profile) => (
                  <option key={profile.email} value={profile.email}>
                    {profile.role}: {profile.email}
                  </option>
                ))}
              </select>
              <SubmitButton pendingText="Входим...">Войти</SubmitButton>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
