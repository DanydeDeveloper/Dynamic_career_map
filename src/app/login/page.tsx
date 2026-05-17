import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, auth } from "@/auth";
import { FormPendingNotice, SubmitButton } from "@/components/forms/SubmitButton";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

async function loginAction(formData: FormData) {
  "use server";

  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirectTo: "/"
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?error=CredentialsSignin");
    }
    throw error;
  }
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  const params = await searchParams;

  if (session?.user) {
    redirect("/");
  }

  return (
    <section className="login-shell">
      <div className="login-panel">
        <p className="eyebrow">Dynamic Career Map</p>
        <h1 className="page-title">Вход в кабинет</h1>
        <p className="page-description">
          Используйте тестовые аккаунты из seed-данных или будущие учетные записи Supabase/PostgreSQL.
        </p>

        {params.error ? <p className="form-error">Не удалось войти. Проверьте email и пароль.</p> : null}

        <form action={loginAction} className="form-grid login-form">
          <div className="field full">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" required type="email" defaultValue="curator@private.education" />
          </div>
          <div className="field full">
            <label htmlFor="password">Пароль</label>
            <input id="password" name="password" required type="password" defaultValue="password123" />
          </div>
          <div className="field full">
            <FormPendingNotice title="Входим в кабинет" description="Проверяем учетные данные и открываем рабочее пространство." />
            <SubmitButton pendingText="Входим...">
              Войти
            </SubmitButton>
          </div>
        </form>
      </div>
    </section>
  );
}
