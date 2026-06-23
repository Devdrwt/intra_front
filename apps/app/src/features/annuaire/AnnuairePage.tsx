import { useMemo, useState, type ReactNode } from 'react';
import { Briefcase, CalendarDays, Hash, Mail, Phone, Search, Users } from 'lucide-react';
import { Avatar, Badge, Card, EmptyState, Input, Modal, PageHeader, Select, Skeleton } from '@drwindesk/ui';
import type { BadgeProps } from '@drwindesk/ui';
import { avatarUrl } from '@/lib/avatar';
import { Stagger, StaggerItem } from '@/components/motion';
import { useAnnuaire } from './hooks';
import type { AnnuaireEntry } from './types';

const fullName = (e: AnnuaireEntry) => `${e.prenom} ${e.nom}`.trim();
const photo = (e: AnnuaireEntry) =>
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

/** Ancienneté lisible depuis la date d'embauche (« 2 ans 3 mois »). */
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

export function AnnuairePage() {
  const { data, isLoading } = useAnnuaire();
  const [q, setQ] = useState('');
  const [dep, setDep] = useState('');
  const [selected, setSelected] = useState<AnnuaireEntry | null>(null);

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

  return (
    <div className="space-y-5">
      <PageHeader title="Annuaire" subtitle="Retrouvez et contactez vos collègues." />

      <Card className="flex flex-wrap items-end gap-3">
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
      </Card>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <Card className="p-0">
          <EmptyState icon={<Users size={20} />} title="Aucun collaborateur" description="Aucun résultat pour cette recherche." />
        </Card>
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
                  </div>
                </Card>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Profil" size="md">
        {selected && <ProfileDetail e={selected} />}
      </Modal>
    </div>
  );
}

function ProfileDetail({ e }: { e: AnnuaireEntry }) {
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
