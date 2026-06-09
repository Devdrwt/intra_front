import { Check, Clock, Minus, X } from 'lucide-react';
import { Spinner, cn } from '@drwindesk/ui';
import { useApprovalRequest } from './hooks';
import type { ApprovalRequestDetail, StepState } from './types';

const STATE_ICON: Record<StepState, typeof Check> = {
  done: Check,
  current: Clock,
  pending: Minus,
  skipped: Minus,
};

const STATE_CLASS: Record<StepState, string> = {
  done: 'bg-success text-white',
  current: 'bg-brand-500 text-white',
  pending: 'bg-surface-muted text-ink-subtle',
  skipped: 'bg-surface-muted text-ink-subtle line-through',
};

function fmt(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/**
 * Timeline de validation réutilisable, à insérer dans n'importe quelle fiche métier
 * (congé, note de frais, demande d'achat…). Soit on passe un `requestId` (auto-fetch),
 * soit un `detail` déjà chargé.
 */
export function ApprovalTimeline({
  requestId,
  detail: provided,
}: {
  requestId?: string;
  detail?: ApprovalRequestDetail;
}) {
  const { data: fetched, isLoading } = useApprovalRequest(provided ? undefined : requestId);
  const detail = provided ?? fetched;

  if (!provided && isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-ink-muted">
        <Spinner /> Chargement du circuit…
      </div>
    );
  }
  if (!detail) return null;

  return (
    <ol className="space-y-3">
      {detail.steps.map((step) => {
        const Icon = STATE_ICON[step.status];
        const decision = detail.decisions.find((d) => d.stepName === step.name);
        return (
          <li key={step.order} className="flex gap-3">
            <span
              className={cn(
                'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                STATE_CLASS[step.status],
              )}
            >
              {step.status === 'skipped' ? <X size={14} /> : <Icon size={14} />}
            </span>
            <div className="min-w-0">
              <div className="text-sm font-medium text-ink">{step.name}</div>
              {decision ? (
                <div className="text-xs text-ink-muted">
                  {decision.action === 'APPROVE' ? 'Approuvé' : decision.action === 'REJECT' ? 'Rejeté' : 'Commenté'}
                  {' · '}
                  {fmt(decision.decidedAt)}
                  {decision.comment ? ` — « ${decision.comment} »` : ''}
                </div>
              ) : (
                <div className="text-xs text-ink-subtle">
                  {step.status === 'current' ? 'En attente de décision' : step.status === 'skipped' ? 'Étape sautée' : 'À venir'}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
