import { ClipboardCheck } from "lucide-react";
import { updateProposalStatusAction } from "@/app/actions";
import { FormPendingNotice, SubmitButton } from "@/components/forms/SubmitButton";
import { proposalStatusLabels, proposalTypeLabels } from "@/lib/constants";
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
  showActions?: boolean;
};

export function ChangeProposalCard({ proposal, showActions = true }: ChangeProposalCardProps) {
  const canAct = showActions && (proposal.status === "pending" || proposal.status === "postponed");

  return (
    <article className="proposal-card">
      <div className="student-card-top">
        <div>
          <span className="tag primary">{proposalStatusLabels[proposal.status] ?? proposal.status}</span>
          <span className="tag accent">{proposalTypeLabels[proposal.proposalType] ?? "Применение к стратегии"}</span>
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

      {canAct ? (
        <div className="proposal-actions">
          <form action={updateProposalStatusAction}>
            <input name="proposalId" type="hidden" value={proposal.id} />
            <input name="status" type="hidden" value="approved" />
            <FormPendingNotice
              title="Согласование применяется"
              description="Применяем изменения к профилю, карте или стратегии и пишем журнал."
            />
            <SubmitButton pendingText="Согласуем...">Согласовать</SubmitButton>
          </form>
          <form action={updateProposalStatusAction}>
            <input name="proposalId" type="hidden" value={proposal.id} />
            <input name="status" type="hidden" value="edited" />
            <FormPendingNotice
              title="Согласование применяется"
              description="Применяем изменения к профилю, карте или стратегии и пишем журнал."
            />
            <SubmitButton className="button" pendingText="Согласуем...">Редактировать и согласовать</SubmitButton>
          </form>
          <form action={updateProposalStatusAction}>
            <input name="proposalId" type="hidden" value={proposal.id} />
            <input name="status" type="hidden" value="postponed" />
            <FormPendingNotice title="Решение сохраняется" description="Обновляем статус предложения." />
            <SubmitButton className="button" pendingText="Откладываем...">Отложить</SubmitButton>
          </form>
          <form action={updateProposalStatusAction}>
            <input name="proposalId" type="hidden" value={proposal.id} />
            <input name="status" type="hidden" value="rejected" />
            <FormPendingNotice title="Решение сохраняется" description="Обновляем статус предложения." />
            <SubmitButton className="button" pendingText="Отклоняем...">Отклонить</SubmitButton>
          </form>
        </div>
      ) : null}
    </article>
  );
}
