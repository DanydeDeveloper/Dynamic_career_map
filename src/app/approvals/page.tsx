import { ChangeProposalCard } from "@/components/approvals/ChangeProposalCard";
import { getPendingProposals } from "@/lib/data";
import { canManageApprovals, requireUser } from "@/lib/authz";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const user = await requireUser();

  if (!canManageApprovals(user.role)) {
    notFound();
  }

  const proposals = await getPendingProposals(user);

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Согласование педагога</p>
          <h1 className="page-title">Предложения изменений</h1>
          <p className="page-description">
            Система может предлагать обновления профиля, насмотренности, стратегии и карты. После согласования
            изменения применяются к данным ученика.
          </p>
        </div>
      </header>

      <div className="grid">
        {proposals.length > 0 ? (
          proposals.map((proposal) => <ChangeProposalCard key={proposal.id} proposal={proposal} />)
        ) : (
          <div className="empty-state">Нет предложений, которые ждут согласования.</div>
        )}
      </div>
    </>
  );
}
