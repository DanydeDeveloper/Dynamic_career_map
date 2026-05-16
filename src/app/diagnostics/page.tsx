import { ParentRequestForm } from "@/components/forms/ParentRequestForm";
import { StudentDiagnosticForm } from "@/components/forms/StudentDiagnosticForm";

export default function DiagnosticsPage() {
  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Диагностика</p>
          <h1 className="page-title">Первичный сбор данных</h1>
          <p className="page-description">
            В первом MVP формы служат понятным рабочим шаблоном. Следующий шаг - привязать сохранение к базе и
            генерации первичного профиля.
          </p>
        </div>
      </header>

      <div className="grid two">
        <StudentDiagnosticForm />
        <ParentRequestForm />
      </div>
    </>
  );
}
