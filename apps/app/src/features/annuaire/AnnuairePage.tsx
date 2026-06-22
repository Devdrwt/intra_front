import { useMemo, useState } from 'react';
import { Mail, Phone, Search, Users } from 'lucide-react';
import { Avatar, Card, EmptyState, Input, PageHeader, Select, Skeleton } from '@drwindesk/ui';
import { avatarUrl } from '@/lib/avatar';
import { Stagger, StaggerItem } from '@/components/motion';
import { useAnnuaire } from './hooks';
import type { AnnuaireEntry } from './types';

const fullName = (e: AnnuaireEntry) => `${e.prenom} ${e.nom}`.trim();
const photo = (e: AnnuaireEntry) =>
  (e.userId ? avatarUrl(e.userId, e.hasAvatar) : undefined) ?? e.photoUrl ?? undefined;

export function AnnuairePage() {
  const { data, isLoading } = useAnnuaire();
  const [q, setQ] = useState('');
  const [dep, setDep] = useState('');

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
      <PageHeader
        title="Annuaire"
        subtitle="Retrouvez et contactez vos collègues."
      />

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
          {list.map((e) => (
            <StaggerItem key={e.id} className="h-full">
              <Card className="flex h-full flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={fullName(e)} src={photo(e)} size="lg" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{fullName(e)}</p>
                    <p className="truncate text-sm text-ink-muted">{e.poste}</p>
                    <p className="truncate text-xs text-ink-subtle">
                      {e.departement}
                      {e.service ? ` · ${e.service}` : ''}
                    </p>
                  </div>
                </div>
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
          ))}
        </Stagger>
      )}
    </div>
  );
}
