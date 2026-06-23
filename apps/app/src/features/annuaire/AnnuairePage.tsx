import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  CalendarDays,
  Contact,
  Download,
  FileDown,
  Hash,
  LayoutGrid,
  Mail,
  MessageSquare,
  Network,
  Phone,
  Search,
  Users,
} from 'lucide-react';
import { Avatar, Badge, Button, Card, EmptyState, Input, Modal, PageHeader, Select, Skeleton, cn } from '@drwindesk/ui';
import type { BadgeProps } from '@drwindesk/ui';
import { avatarUrl } from '@/lib/avatar';
import { triggerDownload } from '@/lib/download';
import { Stagger, StaggerItem } from '@/components/motion';
import { useCreateDirect } from '@/features/discussion/hooks';
import { useAnnuaire, useOrganigramme } from './hooks';
import type { AnnuaireEntry, OrgNode } from './types';

const fullName = (e: { prenom: string; nom: string }) => `${e.prenom} ${e.nom}`.trim();
const photo = (e: { userId: string | null; hasAvatar: boolean; photoUrl?: string | null }) =>
  (e.userId ? avatarUrl(e.userId, e.hasAvatar) : undefined) ?? e.photoUrl ?? undefined;

const CONTRAT: Record<string, { label: string; tone: NonNullable<BadgeProps['tone']> }> = {
  CDI: { label: 'CDI', tone: 'success' },
  CDD: { label: 'CDD', tone: 'warning' },
  STAGE: { label: 'Stage', tone: 'neutral' },
  ALTERNANCE: { label: 'Alternance', tone: 'neutral' },
  INTERIM: { label: 'Intérim', tone: 'neutral' },
  PRESTATAIRE: { label: 'Prestataire', tone: 'neutral' },
  FREELANCE: { label: 'Freelance', tone: 'neutral' },
};
const contrat = (t: string) => CONTRAT[t] ?? { label: t, tone: 'neutral' as const };

function anciennete(iso: string): string {
  const start = new Date(iso);
  const now = new Date();
  if (Number.isNaN(start.getTime())) return '';
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) months--;
  if (months < 1) return 'arrivé·e ce mois-ci';
  if (months < 12) return `${months} mois`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m ? `${y} an${y > 1 ? 's' : ''} ${m} mois` : `${y} an${y > 1 ? 's' : ''}`;
}
const dateFr = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

// ---- Export helpers --------------------------------------------------------
function exportCSV(list: AnnuaireEntry[]) {
  const header = ['Nom', 'Prénom', 'Poste', 'Département', 'Service', 'Contrat', 'Email', 'Téléphone', 'Matricule', 'Embauche'];
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = list.map((e) =>
    [e.nom, e.prenom, e.poste, e.departement, e.service ?? '', e.typeContrat, e.email, e.telephone ?? '', e.matricule, e.dateEmbauche].map(esc).join(','),
  );
  const csv = '﻿' + [header.map(esc).join(','), ...rows].join('\r\n');
  triggerDownload(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'annuaire.csv');
}
function exportVCard(e: AnnuaireEntry) {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${e.nom};${e.prenom}`,
    `FN:${fullName(e)}`,
    `ORG:${e.departement}${e.service ? ';' + e.service : ''}`,
    `TITLE:${e.poste}`,
    `EMAIL:${e.email}`,
    e.telephone ? `TEL:${e.telephone}` : '',
    'END:VCARD',
  ].filter(Boolean);
  triggerDownload(new Blob([lines.join('\r\n')], { type: 'text/vcard' }), `${fullName(e)}.vcf`);
}

type ViewMode = 'cartes' | 'trombi' | 'organigramme';

export function AnnuairePage() {
  const { data, isLoading } = useAnnuaire();
  const navigate = useNavigate();
  const createDirect = useCreateDirect();
  const [q, setQ] = useState('');
  const [dep, setDep] = useState('');
  const [view, setView] = useState<ViewMode>('cartes');
  const [selected, setSelected] = useState<AnnuaireEntry | null>(null);

  const message = async (userId: string | null) => {
    if (!userId) return;
    await createDirect.mutateAsync(userId);
    navigate('/discussion');
  };

  const departements = useMemo(
    () => [...new Set((data ?? []).map((e) => e.departement).filter(Boolean))].sort(),
    [data],
  );

  const list = (data ?? []).filter((e) => {
    const okDep = !dep || e.departement === dep;
    const needle = q.trim().toLowerCase();
    const okQ =
      !needle ||
      fullName(e).toLowerCase().includes(needle) ||
      e.poste.toLowerCase().includes(needle) ||
      (e.service ?? '').toLowerCase().includes(needle);
    return okDep && okQ;
  });

  const VIEWS: { key: ViewMode; label: string; icon: typeof LayoutGrid }[] = [
    { key: 'cartes', label: 'Cartes', icon: Contact },
    { key: 'trombi', label: 'Trombinoscope', icon: LayoutGrid },
    { key: 'organigramme', label: 'Organigramme', icon: Network },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Annuaire"
        subtitle="Retrouvez et contactez vos collègues."
        actions={
          <Button variant="secondary" onClick={() => exportCSV(list)}>
            <FileDown size={16} /> Exporter CSV
          </Button>
        }
      />

      <Card className="flex flex-wrap items-center gap-3">
        <div className="min-w-[220px] flex-1">
          <Input
            leading={<Search size={16} />}
            placeholder="Rechercher un nom, un poste…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Select
          label=""
          placeholder="Tous les départements"
          options={departements.map((d) => ({ value: d, label: d }))}
          value={dep}
          onChange={(e) => setDep(e.target.value)}
        />
        <div className="flex rounded-xl bg-surface-muted p-1">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              title={v.label}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                view === v.key ? 'bg-surface text-ink shadow-soft' : 'text-ink-muted hover:text-ink',
              )}
            >
              <v.icon size={15} />
              <span className="hidden sm:inline">{v.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {view === 'organigramme' ? (
        <OrgView onSelect={(id) => setSelected((data ?? []).find((e) => e.id === id) ?? null)} />
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <Card className="p-0">
          <EmptyState icon={<Users size={20} />} title="Aucun collaborateur" description="Aucun résultat pour cette recherche." />
        </Card>
      ) : view === 'trombi' ? (
        <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {list.map((e) => (
            <StaggerItem key={e.id}>
              <button onClick={() => setSelected(e)} className="flex w-full flex-col items-center gap-2 rounded-2xl border border-surface-border bg-surface p-3 text-center transition-shadow hover:shadow-elevated">
                <Avatar name={fullName(e)} src={photo(e)} size="lg" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{fullName(e)}</p>
                  <p className="truncate text-xs text-ink-subtle">{e.poste}</p>
                </div>
              </button>
            </StaggerItem>
          ))}
        </Stagger>
      ) : (
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((e) => {
            const c = contrat(e.typeContrat);
            return (
              <StaggerItem key={e.id} className="h-full">
                <Card className="flex h-full flex-col gap-3">
                  <button onClick={() => setSelected(e)} className="flex items-start gap-3 text-left">
                    <Avatar name={fullName(e)} src={photo(e)} size="lg" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold text-ink">{fullName(e)}</p>
                        <Badge tone={c.tone}>{c.label}</Badge>
                      </div>
                      <p className="truncate text-sm text-ink-muted">{e.poste}</p>
                      <p className="truncate text-xs text-ink-subtle">
                        {e.departement}
                        {e.service ? ` · ${e.service}` : ''}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-ink-subtle">
                        <CalendarDays size={11} /> {anciennete(e.dateEmbauche)}
                      </p>
                    </div>
                  </button>
                  <div className="mt-auto flex flex-col gap-1.5 border-t border-surface-border pt-3 text-sm">
                    <a href={`mailto:${e.email}`} className="flex items-center gap-2 text-ink-muted transition-colors hover:text-brand-600">
                      <Mail size={14} className="shrink-0" />
                      <span className="truncate">{e.email}</span>
                    </a>
                    {e.telephone && (
                      <a href={`tel:${e.telephone}`} className="flex items-center gap-2 text-ink-muted transition-colors hover:text-brand-600">
                        <Phone size={14} className="shrink-0" />
                        {e.telephone}
                      </a>
                    )}
                    {e.userId && (
                      <button onClick={() => void message(e.userId)} className="flex items-center gap-2 text-brand-600 transition-colors hover:text-brand-700">
                        <MessageSquare size={14} className="shrink-0" /> Envoyer un message
                      </button>
                    )}
                  </div>
                </Card>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Profil" size="md">
        {selected && <ProfileDetail e={selected} onMessage={() => void message(selected.userId)} />}
      </Modal>
    </div>
  );
}

function ProfileDetail({ e, onMessage }: { e: AnnuaireEntry; onMessage: () => void }) {
  const c = contrat(e.typeContrat);
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <Avatar name={fullName(e)} src={photo(e)} size="lg" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-ink">{fullName(e)}</h3>
            <Badge tone={c.tone}>{c.label}</Badge>
          </div>
          <p className="text-sm text-ink-muted">{e.poste}</p>
          <p className="text-xs text-ink-subtle">
            {e.departement}
            {e.service ? ` · ${e.service}` : ''}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Info icon={<Hash size={15} />} label="Matricule" value={e.matricule} />
        <Info icon={<Briefcase size={15} />} label="Contrat" value={c.label} />
        <Info
          icon={<CalendarDays size={15} />}
          label="Dans l'entreprise depuis"
          value={`${dateFr(e.dateEmbauche)} · ${anciennete(e.dateEmbauche)}`}
        />
      </div>

      <div className="grid gap-2 border-t border-surface-border pt-4">
        <a href={`mailto:${e.email}`} className="flex items-center gap-2 text-sm text-ink-muted hover:text-brand-600">
          <Mail size={15} className="shrink-0" /> {e.email}
        </a>
        {e.telephone && (
          <a href={`tel:${e.telephone}`} className="flex items-center gap-2 text-sm text-ink-muted hover:text-brand-600">
            <Phone size={15} className="shrink-0" /> {e.telephone}
          </a>
        )}
      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t border-surface-border pt-4">
        <Button variant="secondary" size="sm" onClick={() => exportVCard(e)}>
          <Download size={15} /> vCard
        </Button>
        {e.userId && (
          <Button size="sm" onClick={onMessage}>
            <MessageSquare size={15} /> Message
          </Button>
        )}
      </div>
    </div>
  );
}

function Info({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-muted px-3 py-2">
      <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-ink-subtle">
        {icon} {label}
      </p>
      <p className="mt-0.5 text-sm font-medium text-ink">{value}</p>
    </div>
  );
}

// ---- Organigramme ----------------------------------------------------------
function OrgView({ onSelect }: { onSelect: (id: string) => void }) {
  const { data, isLoading } = useOrganigramme();
  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    );
  }
  const roots = data ?? [];
  const hasHierarchy = roots.some((r) => r.children.length > 0);

  if (!hasHierarchy) {
    // Pas de responsables renseignés → repli groupé par département.
    const byDep = new Map<string, OrgNode[]>();
    for (const n of roots) {
      const arr = byDep.get(n.departement) ?? [];
      arr.push(n);
      byDep.set(n.departement, arr);
    }
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...byDep.entries()].map(([dep, people]) => (
          <Card key={dep}>
            <p className="mb-2 text-sm font-semibold text-ink">{dep}</p>
            <div className="space-y-1.5">
              {people.map((p) => (
                <OrgChip key={p.id} node={p} onSelect={onSelect} />
              ))}
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Card className="overflow-x-auto">
      <div className="space-y-2">
        {roots.map((r) => (
          <OrgBranch key={r.id} node={r} onSelect={onSelect} />
        ))}
      </div>
    </Card>
  );
}

function OrgChip({ node, onSelect }: { node: OrgNode; onSelect: (id: string) => void }) {
  return (
    <button
      onClick={() => onSelect(node.id)}
      className="flex w-full items-center gap-2 rounded-xl border border-surface-border bg-surface px-3 py-2 text-left transition-colors hover:bg-surface-muted"
    >
      <Avatar name={fullName(node)} src={photo(node)} size="sm" />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-ink">{fullName(node)}</p>
        <p className="truncate text-xs text-ink-subtle">{node.poste}</p>
      </div>
    </button>
  );
}

function OrgBranch({ node, onSelect }: { node: OrgNode; onSelect: (id: string) => void }) {
  return (
    <div>
      <OrgChip node={node} onSelect={onSelect} />
      {node.children.length > 0 && (
        <div className="ml-5 mt-2 space-y-2 border-l-2 border-surface-border pl-4">
          {node.children.map((c) => (
            <OrgBranch key={c.id} node={c} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}
