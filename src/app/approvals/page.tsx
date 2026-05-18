import { ChangeProposalCard } from "@/components/approvals/ChangeProposalCard";
import { StudentEventSelectionCard } from "@/components/approvals/StudentEventSelectionCard";
import { getPendingProposals, getPendingStudentEventSelections } from "@/lib/data";
import { canManageApprovals, requireUser } from "@/lib/authz";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const user = await requireUser();

  if (!canManageApprovals(user.role)) {
    notFound();
  }

  const [proposals, eventSelections] = await Promise.all([
    getPendingProposals(user),
    getPendingStudentEventSelections(user)
  ]);

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Согласование куратора</p>
          <h1 className="page-title">Предложения изменений</h1>
          <p className="page-description">
            Система может предлагать обновления профиля, насмотренности, стратегии и карты. После согласования
            изменения применяются к данным ученика.
          </p>
        </div>
      </header>

      <section className="section">
        <div className="panel-header">
          <div>
            <h2 className="section-title">Выборы учеников</h2>
            <p className="muted">Мероприятия, которые ученики выбрали сами и ждут решения куратора.</p>
          </div>
          <span className="tag primary">{eventSelections.length}</span>
        </div>
        <div className="grid">
          {eventSelections.length > 0 ? (
            eventSelections.map((selection) => <StudentEventSelectionCard key={selection.id} selection={selection} />)
          ) : (
            <div className="empty-state">Нет выбранных учениками мероприятий, которые ждут решения.</div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="panel-header">
          <div>
            <h2 className="section-title">Предложения изменений</h2>
            <p className="muted">Изменения профиля, стратегии и карты после диагностики или обратной связи.</p>
          </div>
          <span className="tag primary">{proposals.length}</span>
        </div>
        <div className="grid">
          {proposals.length > 0 ? (
            proposals.map((proposal) => <ChangeProposalCard key={proposal.id} proposal={proposal} />)
          ) : (
            <div className="empty-state">Нет предложений, которые ждут согласования.</div>
          )}
        </div>
      </section>
    </>
  );
}
