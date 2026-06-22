import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpCircle, Lock, Send } from 'lucide-react';
import { Badge, Button, Card, Select, Spinner, Textarea, cn } from '@drwindesk/ui';
import { hasPermission, useAuth } from '@/auth/AuthContext';
import { Stagger, StaggerItem } from '@/components/motion';
import { SlaBadge } from './SupportPage';
import { useAddComment, useEscalateTicket, usePatchTicket, useTicket } from './hooks';
import { PRIORITY_LABEL, STATUS_OPTIONS, TYPE_LABEL, type TicketStatus } from './types';

function fmt(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function TicketDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const canWrite = hasPermission(user, 'support:write');
  const { data: ticket, isLoading } = useTicket(id);
  const patch = usePatchTicket();
  const escalate = useEscalateTicket();

  if (isLoading) {
    return <div className="flex items-center gap-2 text-ink-muted"><Spinner /> Chargement…</div>;
  }
  if (!ticket) {
    return <Card><p className="text-ink-muted">Ticket introuvable.</p></Card>;
  }

  return (
    <div className="space-y-5">
      <Link to="/support" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft size={16} /> Retour aux tickets
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{ticket.reference}</Badge>
            <Badge tone="brand">{TYPE_LABEL[ticket.type]}</Badge>
            <Badge tone={ticket.priority === 'CRITICAL' || ticket.priority === 'HIGH' ? 'warning' : 'neutral'}>
              {PRIORITY_LABEL[ticket.priority]}
            </Badge>
            <SlaBadge dueAt={ticket.slaResolutionDueAt} breached={ticket.slaResolutionBreached} />
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-ink">{ticket.title}</h2>
          <p className="text-xs text-ink-subtle">Ouvert le {fmt(ticket.createdAt)}</p>
        </div>
        {canWrite && (
          <div className="flex flex-wrap items-end gap-2">
            <Select
              id="status"
              label="Statut"
              value={ticket.status}
              onChange={(e) => patch.mutate({ id: ticket.id, patch: { status: e.target.value as TicketStatus } })}
              options={STATUS_OPTIONS}
            />
            <Button variant="secondary" disabled={escalate.isPending} onClick={() => escalate.mutate(ticket.id)}>
              <ArrowUpCircle size={16} /> Escalader
            </Button>
          </div>
        )}
      </header>

      <Card>
        <h3 className="mb-1 text-sm font-semibold text-ink">Description</h3>
        <p className="whitespace-pre-wrap text-sm text-ink-muted">{ticket.description}</p>
      </Card>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-ink">
          Échanges {ticket.comments.length > 0 && <span className="text-ink-subtle">({ticket.comments.length})</span>}
        </h3>
        {ticket.comments.length === 0 && <p className="text-sm text-ink-subtle">Aucun échange pour l'instant.</p>}
        <Stagger className="space-y-3">
          {ticket.comments.map((c) => (
            <StaggerItem key={c.id}>
            <Card className={cn(c.type === 'INTERNAL' && 'border-warning/30 bg-warning-soft/30')}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-ink">{c.authorId === 'me' ? 'Moi' : c.authorId ?? 'Système'}</span>
                <span className="flex items-center gap-2 text-xs text-ink-subtle">
                  {c.type === 'INTERNAL' && <Badge tone="warning"><Lock size={11} /> Interne</Badge>}
                  {fmt(c.createdAt)}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-ink-muted">{c.content}</p>
            </Card>
            </StaggerItem>
          ))}
        </Stagger>
        <CommentForm ticketId={ticket.id} canInternal={canWrite} />
      </section>
    </div>
  );
}

function CommentForm({ ticketId, canInternal }: { ticketId: string; canInternal: boolean }) {
  const add = useAddComment();
  const [content, setContent] = useState('');
  const [internal, setInternal] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    await add.mutateAsync({ id: ticketId, content: content.trim(), type: internal ? 'INTERNAL' : 'PUBLIC' });
    setContent('');
  };

  return (
    <Card>
      <form onSubmit={onSubmit} className="grid gap-3">
        <Textarea id="comment" label="Répondre" rows={3} value={content} onChange={(e) => setContent(e.target.value)} />
        <div className="flex items-center justify-between gap-3">
          {canInternal ? (
            <label className="flex items-center gap-2 text-sm text-ink-muted">
              <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} />
              Note interne (non visible du demandeur)
            </label>
          ) : (
            <span />
          )}
          <Button type="submit" loading={add.isPending} disabled={!content.trim()}>
            <Send size={16} /> Envoyer
          </Button>
        </div>
      </form>
    </Card>
  );
}
