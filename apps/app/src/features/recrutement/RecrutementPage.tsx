import { useState } from 'react';
import { Check, FileText, Inbox, Mail } from 'lucide-react';
import { Badge, Button, Card, Select, Spinner, cn } from '@drwindesk/ui';
import type { BadgeProps } from '@drwindesk/ui';
import {
  useCandidatures,
  useContactMessages,
  useMarkContactTraite,
  useSetCandidatureStatut,
} from './hooks';
import {
  STATUT_LABEL,
  STATUT_OPTIONS,
  type CandidatureStatut,
} from './types';

type Tab = 'candidatures' | 'messages';

const STATUT_TONE: Record<CandidatureStatut, NonNullable<BadgeProps['tone']>> = {
  RECUE: 'neutral',
  EN_REVUE: 'brand',
  ENTRETIEN: 'warning',
  ACCEPTEE: 'success',
  REFUSEE: 'danger',
};

function fmt(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function RecrutementPage() {
  const [tab, setTab] = useState<Tab>('candidatures');
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ink">Recrutement</h1>
        <p className="text-ink-muted">
          Candidatures et messages de contact remontés du site public.
        </p>
      </header>

      <div className="mb-4 flex gap-1 rounded-xl bg-surface-muted p-1">
        {(
          [
            ['candidatures', 'Candidatures'],
            ['messages', 'Messages de contact'],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              tab === key ? 'bg-surface text-ink shadow-card' : 'text-ink-muted hover:text-ink',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'candidatures' ? <CandidaturesPanel /> : <MessagesPanel />}
    </div>
  );
}

function CandidaturesPanel() {
  const [statut, setStatut] = useState<CandidatureStatut | ''>('');
  const { data: list, isLoading } = useCandidatures(statut || undefined);
  const setStatutMut = useSetCandidatureStatut();

  return (
    <div>
      <Card className="mb-4">
        <div className="sm:max-w-xs">
          <Select
            options={STATUT_OPTIONS}
            placeholder="Tous les statuts"
            value={statut}
            onChange={(e) => setStatut(e.target.value as CandidatureStatut | '')}
          />
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : !list || list.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Inbox className="text-ink-subtle" />
            <p className="text-ink-muted">Aucune candidature.</p>
          </div>
        ) : (
          <ul className="divide-y divide-surface-border">
            {list.map((c) => (
              <li key={c.id} className="flex flex-wrap items-start gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink">{c.nom}</span>
                    <Badge tone={STATUT_TONE[c.statut]}>{STATUT_LABEL[c.statut]}</Badge>
                  </div>
                  <div className="text-sm text-ink-muted">
                    {c.poste ?? 'Candidature spontanée'} · {c.email}
                    {c.telephone && ` · ${c.telephone}`}
                  </div>
                  {c.message && <p className="mt-1 text-sm text-ink-muted">{c.message}</p>}
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-xs text-ink-subtle">Reçue le {fmt(c.createdAt)}</span>
                    {c.cvUrl && (
                      <a
                        href={c.cvUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
                      >
                        <FileText size={13} /> CV
                      </a>
                    )}
                  </div>
                </div>
                <div className="w-44">
                  <Select
                    options={STATUT_OPTIONS}
                    value={c.statut}
                    disabled={setStatutMut.isPending}
                    onChange={(e) =>
                      setStatutMut.mutate({ id: c.id, statut: e.target.value as CandidatureStatut })
                    }
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function MessagesPanel() {
  const [pending, setPending] = useState(false);
  const { data: list, isLoading } = useContactMessages(pending);
  const markTraite = useMarkContactTraite();

  return (
    <div>
      <div className="mb-4 flex gap-1 rounded-xl bg-surface-muted p-1 sm:max-w-xs">
        {(
          [
            [false, 'Tous'],
            [true, 'Non traités'],
          ] as [boolean, string][]
        ).map(([key, label]) => (
          <button
            key={String(key)}
            onClick={() => setPending(key)}
            className={cn(
              'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              pending === key ? 'bg-surface text-ink shadow-card' : 'text-ink-muted hover:text-ink',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : !list || list.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Mail className="text-ink-subtle" />
            <p className="text-ink-muted">Aucun message.</p>
          </div>
        ) : (
          <ul className="divide-y divide-surface-border">
            {list.map((m) => (
              <li key={m.id} className={cn('flex items-start gap-4 px-5 py-4', !m.traite && 'bg-brand-50/40')}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink">{m.sujet ?? 'Sans objet'}</span>
                    {m.traite ? (
                      <Badge tone="success">Traité</Badge>
                    ) : (
                      <Badge tone="warning">À traiter</Badge>
                    )}
                  </div>
                  <div className="text-sm text-ink-muted">
                    {m.nom} · {m.email}
                  </div>
                  <p className="mt-1 text-sm text-ink-muted">{m.message}</p>
                  <span className="mt-1 block text-xs text-ink-subtle">Reçu le {fmt(m.createdAt)}</span>
                </div>
                {!m.traite && (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={markTraite.isPending}
                    onClick={() => markTraite.mutate(m.id)}
                  >
                    <Check size={15} /> Traité
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
