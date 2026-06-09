import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { LifeBuoy, Plus, X } from 'lucide-react';
import {
  Badge,
  Button,
  Callout,
  Card,
  EmptyState,
  Input,
  Select,
  SkeletonRows,
  Textarea,
} from '@drwindesk/ui';
import type { BadgeProps } from '@drwindesk/ui';
import { apiErrorMessage } from '@/lib/api';
import { useCreateTicket, useTickets } from './hooks';
import {
  PRIORITY_LABEL,
  PRIORITY_OPTIONS,
  STATUS_LABEL,
  STATUS_OPTIONS,
  TYPE_OPTIONS,
  type CreateTicketInput,
  type Ticket,
  type TicketPriority,
  type TicketStatus,
} from './types';

const STATUS_TONE: Record<TicketStatus, NonNullable<BadgeProps['tone']>> = {
  NEW: 'brand',
  ASSIGNED: 'brand',
  IN_PROGRESS: 'warning',
  ON_HOLD: 'neutral',
  ESCALATED: 'danger',
  RESOLVED: 'success',
  CLOSED: 'neutral',
};
const PRIORITY_TONE: Record<TicketPriority, NonNullable<BadgeProps['tone']>> = {
  CRITICAL: 'danger',
  HIGH: 'warning',
  NORMAL: 'neutral',
  LOW: 'neutral',
};

export function SlaBadge({ dueAt, breached }: { dueAt?: string; breached?: boolean }) {
  if (breached) return <Badge tone="danger" dot>SLA dépassé</Badge>;
  if (!dueAt) return null;
  const h = (new Date(dueAt).getTime() - Date.now()) / 3_600_000;
  if (Number.isNaN(h)) return null;
  if (h < 0) return <Badge tone="danger" dot>SLA dépassé</Badge>;
  if (h < 4) return <Badge tone="warning" dot>Bientôt ({Math.round(h)}h)</Badge>;
  return <Badge tone="success">OK</Badge>;
}

export function SupportPage() {
  const [status, setStatus] = useState<TicketStatus | ''>('');
  const [priority, setPriority] = useState<TicketPriority | ''>('');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const filters = useMemo(() => ({ status, priority, search }), [status, priority, search]);
  const { data: tickets, isLoading } = useTickets(filters);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-ink">Support</h2>
          <p className="text-ink-muted">Tickets internes : incidents, demandes, accès, moyens généraux.</p>
        </div>
        <Button onClick={() => setOpen((v) => !v)} variant={open ? 'secondary' : 'primary'}>
          {open ? <X size={18} /> : <Plus size={18} />} {open ? 'Fermer' : 'Nouveau ticket'}
        </Button>
      </header>

      {open && <CreatePanel onDone={() => setOpen(false)} />}

      <Card className="flex flex-wrap items-end gap-3">
        <Input
          id="q"
          label="Recherche"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Référence, titre…"
          className="min-w-[200px] flex-1"
        />
        <Select
          id="status"
          label="Statut"
          value={status}
          onChange={(e) => setStatus(e.target.value as TicketStatus | '')}
          options={[{ value: '', label: 'Tous' }, ...STATUS_OPTIONS]}
        />
        <Select
          id="priority"
          label="Priorité"
          value={priority}
          onChange={(e) => setPriority(e.target.value as TicketPriority | '')}
          options={[{ value: '', label: 'Toutes' }, ...PRIORITY_OPTIONS]}
        />
      </Card>

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <SkeletonRows rows={5} cols={4} />
        ) : !tickets || tickets.length === 0 ? (
          <EmptyState icon={<LifeBuoy size={20} />} title="Aucun ticket" description="Aucun ticket ne correspond à ces filtres." />
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-surface-border bg-surface-muted text-left text-xs uppercase tracking-wide text-ink-subtle">
              <tr>
                <th className="px-5 py-2.5 font-medium">Ticket</th>
                <th className="hidden px-5 py-2.5 font-medium sm:table-cell">Priorité</th>
                <th className="px-5 py-2.5 font-medium">Statut</th>
                <th className="px-5 py-2.5 font-medium">SLA</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t: Ticket) => (
                <tr key={t.id} className="border-b border-surface-border last:border-0 hover:bg-surface-muted/50">
                  <td className="px-5 py-3">
                    <Link to={`/support/${t.id}`} className="block">
                      <div className="font-medium text-ink">{t.title}</div>
                      <div className="text-xs text-ink-subtle">{t.reference}{t.category ? ` · ${t.category}` : ''}</div>
                    </Link>
                  </td>
                  <td className="hidden px-5 py-3 sm:table-cell">
                    <Badge tone={PRIORITY_TONE[t.priority]}>{PRIORITY_LABEL[t.priority]}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={STATUS_TONE[t.status]} dot>{STATUS_LABEL[t.status]}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <SlaBadge dueAt={t.slaResolutionDueAt} breached={t.slaResolutionBreached} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function CreatePanel({ onDone }: { onDone: () => void }) {
  const create = useCreateTicket();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('INCIDENT');
  const [priority, setPriority] = useState('NORMAL');
  const [category, setCategory] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !description.trim()) return setError('Titre et description requis.');
    try {
      const input: CreateTicketInput = {
        title: title.trim(),
        description: description.trim(),
        type: type as CreateTicketInput['type'],
        priority: priority as CreateTicketInput['priority'],
        category: category || undefined,
      };
      await create.mutateAsync(input);
      onDone();
    } catch (err) {
      setError(apiErrorMessage(err, 'Création impossible.'));
    }
  };

  return (
    <Card className="mb-1">
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        <Input id="title" label="Titre *" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea id="desc" label="Description *" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Select id="type" label="Type" value={type} onChange={(e) => setType(e.target.value)} options={TYPE_OPTIONS} />
          <Select id="prio" label="Priorité" value={priority} onChange={(e) => setPriority(e.target.value)} options={PRIORITY_OPTIONS} />
          <Input id="cat" label="Catégorie" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="IT, RH…" />
        </div>
        {error && <Callout tone="danger">{error}</Callout>}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onDone}>Annuler</Button>
          <Button type="submit" loading={create.isPending}>Créer le ticket</Button>
        </div>
      </form>
    </Card>
  );
}
