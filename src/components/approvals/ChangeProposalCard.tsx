import { ClipboardCheck } from "lucide-react";
import { proposalStatusLabels } from "@/lib/constants";
import { formatDate } from "@/lib/format";

type ChangeProposalCardProps = {
  proposal: {
    id: string;
    proposalType: string;
    description: string;
    oldValue: string | null;
    newValue: string | null;
    reason: string;
    status: string;
    createdAt: Date;
    student?: { name: string } | null;
    triggerEvent?: { title: string } | null;
  };
};

export function ChangeProposalCard({ proposal }: ChangeProposalCardProps) {
  return (
    <article className="proposal-card">
      <div className="student-card-top">
        <div>
          <span className="tag primary">{proposalStatusLabels[proposal.status] ?? proposal.status}</span>
          <h2 className="student-name">{proposal.description}</h2>
        </div>
        <ClipboardCheck size={22} aria-hidden="true" />
      </div>

      <p className="muted">
        {proposal.student?.name ? `${proposal.student.name} · ` : ""}
        {proposal.triggerEvent?.title ? `${proposal.triggerEvent.title} · ` : ""}
        {formatDate(proposal.createdAt)}
      </p>

      <p>{proposal.reason}</p>

      {(proposal.oldValue || proposal.newValue) && (
        <div className="grid two">
          <div>
            <strong>Было</strong>
            <p className="muted">{proposal.oldValue ?? "Не указано"}</p>
          </div>
          <div>
            <strong>Предлагается</strong>
            <p className="muted">{proposal.newValue ?? "Не указано"}</p>
          </div>
        </div>
      )}

      <div className="proposal-actions">
        <button className="button primary" type="button">
          Одобрить
        </button>
        <button className="button" type="button">
          Редактировать и одобрить
        </button>
        <button className="button" type="button">
          Отложить
        </button>
        <button className="button" type="button">
          Отклонить
        </button>
      </div>
    </article>
  );
}
