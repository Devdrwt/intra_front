import { useState } from 'react';
import { CheckCircle2, Inbox, MessageSquare, ThumbsDown, ThumbsUp } from 'lucide-react';
import { Badge, Button, Card, EmptyState, PageHeader, SkeletonRows, cn } from '@drwindesk/ui';
import { hasPermission, useAuth } from '@/auth/AuthContext';
import { Stagger, StaggerItem } from '@/components/motion';
import { ApprovalTimeline } from './ApprovalTimeline';
import { useApprovalInbox, useApprovalInboxCount, useCancelRequest, useDecide, useMyRequests } from './hooks';
import { ENTITY_LABEL, STATUS_LABEL, type ApprovalStatus, type ApprovableType } from './types';

const STATUS_TONE: Record<ApprovalStatus, 'success' | 'warning' | 'danger' | 'neutral'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  CANCELLED: 'neutral',
};

function fmt(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/** Badge SLA : vert (large), orange (<6h), rouge (dépassé). */
function SlaBadge({ dueAt }: { dueAt?: string }) {
  if (!dueAt) return null;
  const hours = (new Date(dueAt).getTime() - Date.now()) / 3_600_000;
  if (Number.isNaN(hours)) return null;
  if (hours < 0) return <Badge tone="danger" dot>SLA dépassé</Badge>;
  if (hours < 6) return <Badge tone="warning" dot>Bientôt ({Math.round(hours)}h)</Badge>;
  return <Badge tone="success">Dans les délais</Badge>;
}

export function MesValidationsPage() {
  const { user } = useAuth();
  const canAct = hasPermission(user, 'approval:act');
  const inboxCount = useApprovalInboxCount();
  const [tab, setTab] = useState<'inbox' | 'mine'>(canAct ? 'inbox' : 'mine');

  return (
    <div className="space-y-5">
      <PageHeader
        title="Mes validations"
        subtitle="Congés, frais, achats et demandes à valider — au même endroit."
      />

      <div className="flex gap-2 border-b border-surface-border">
        {canAct && (
          <TabButton active={tab === 'inbox'} onClick={() => setTab('inbox')} label="À valider" count={inboxCount} />
        )}
        <TabButton active={tab === 'mine'} onClick={() => setTab('mine')} label="Mes demandes" />
      </div>

      {tab === 'inbox' && canAct ? <InboxTab /> : <MineTab />}
    </div>
  );
}

function TabButton({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count?: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        '-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
        active ? 'border-brand-500 text-brand-700' : 'border-transparent text-ink-muted hover:text-ink',
      )}
    >
      {label}
      {count != null && count > 0 && (
        <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-warning px-1.5 text-[11px] font-semibold text-white">
          {count}
        </span>
      )}
    </button>
  );
}

function InboxTab() {
  const { data: tasks, isLoading } = useApprovalInbox();
  const decide = useDecide();
  const [openId, setOpenId] = useState<string | null>(null);

  if (isLoading) return <Card className="p-0"><SkeletonRows rows={4} cols={3} /></Card>;
  if (!tasks || tasks.length === 0) {
    return (
      <EmptyState
        icon={<CheckCircle2 size={20} />}
        title="Rien à valider"
        description="Vous n'avez aucune demande en attente de votre décision."
      />
    );
  }

  return (
    <Stagger className="space-y-3">
      {tasks.map((t) => (
        <StaggerItem key={t.requestId}>
        <Card className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Badge tone="brand">{ENTITY_LABEL[t.entityType as ApprovableType]}</Badge>
                <SlaBadge dueAt={t.slaDueAt} />
              </div>
              <div className="mt-1.5 font-medium text-ink">{t.label}</div>
              <div className="text-xs text-ink-subtle">
                {t.stepName} · soumis le {fmt(t.startedAt)}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={decide.isPending}
                onClick={() => decide.mutate({ id: t.requestId, input: { action: 'APPROVE' } })}
              >
                <ThumbsUp size={15} /> Approuver
              </Button>
              <Button
                size="sm"
                variant="danger"
                disabled={decide.isPending}
                onClick={() => {
                  const comment = prompt('Motif du rejet (optionnel) :') ?? undefined;
                  decide.mutate({ id: t.requestId, input: { action: 'REJECT', comment } });
                }}
              >
                <ThumbsDown size={15} /> Rejeter
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setOpenId((v) => (v === t.requestId ? null : t.requestId))}
              >
                <MessageSquare size={15} /> Détail
              </Button>
            </div>
          </div>
          {openId === t.requestId && (
            <div className="border-t border-surface-border pt-3">
              <ApprovalTimeline requestId={t.requestId} />
            </div>
          )}
        </Card>
        </StaggerItem>
      ))}
    </Stagger>
  );
}

function MineTab() {
  const { data: reqs, isLoading } = useMyRequests();
  const cancel = useCancelRequest();
  const [openId, setOpenId] = useState<string | null>(null);

  if (isLoading) return <Card className="p-0"><SkeletonRows rows={3} cols={3} /></Card>;
  if (!reqs || reqs.length === 0) {
    return (
      <EmptyState
        icon={<Inbox size={20} />}
        title="Aucune demande en cours"
        description="Vos demandes en validation (congés, frais…) apparaîtront ici."
      />
    );
  }

  return (
    <Stagger className="space-y-3">
      {reqs.map((r) => (
        <StaggerItem key={r.id}>
        <Card className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Badge tone="neutral">{ENTITY_LABEL[r.entityType]}</Badge>
                <Badge tone={STATUS_TONE[r.status]} dot>
                  {STATUS_LABEL[r.status]}
                </Badge>
              </div>
              <div className="mt-1.5 font-medium text-ink">{r.label ?? r.entityId}</div>
              <div className="text-xs text-ink-subtle">soumis le {fmt(r.startedAt)}</div>
            </div>
            <div className="flex gap-2">
              {r.status === 'PENDING' && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={cancel.isPending}
                  onClick={() => {
                    if (confirm('Annuler cette demande ?')) cancel.mutate(r.id);
                  }}
                >
                  Annuler
                </Button>
              )}
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setOpenId((v) => (v === r.id ? null : r.id))}
              >
                Suivi
              </Button>
            </div>
          </div>
          {openId === r.id && (
            <div className="border-t border-surface-border pt-3">
              <ApprovalTimeline requestId={r.id} />
            </div>
          )}
        </Card>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
