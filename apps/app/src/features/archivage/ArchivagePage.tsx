import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Cloud, HardDrive, Lock, LockOpen, ShieldCheck } from 'lucide-react';
import { Badge, Button, Card, CardTitle, PageHeader, SkeletonRows } from '@drwindesk/ui';
import type { BadgeProps } from '@drwindesk/ui';
import { archivageService, type StatutArchive, type TypeArchiveStore } from './service';

const STORE_LABEL: Record<TypeArchiveStore, string> = {
  LOCAL: 'Local',
  S3: 'Amazon S3',
  SCALEWAY: 'Scaleway',
  AWS_GLACIER: 'AWS Glacier',
  AZURE_BLOB: 'Azure Blob',
  GCS: 'Google Cloud',
};
const ARCHIVE_TONE: Record<StatutArchive, NonNullable<BadgeProps['tone']>> = {
  ARCHIVE: 'brand',
  SOUS_RETENTION_LEGALE: 'warning',
  A_PURGER: 'danger',
  PURGE: 'neutral',
  RESTAURE: 'success',
};
const ARCHIVE_LABEL: Record<StatutArchive, string> = {
  ARCHIVE: 'Archivé',
  SOUS_RETENTION_LEGALE: 'Rétention légale',
  A_PURGER: 'À purger',
  PURGE: 'Purgé',
  RESTAURE: 'Restauré',
};

export function ArchivagePage() {
  const qc = useQueryClient();
  const { data: stores } = useQuery({ queryKey: ['archivage', 'stores'], queryFn: archivageService.stores });
  const { data: politiques } = useQuery({ queryKey: ['archivage', 'politiques'], queryFn: archivageService.politiques });
  const { data: archives, isLoading } = useQuery({ queryKey: ['archivage', 'archives'], queryFn: archivageService.archives });
  const toggleStore = useMutation({
    mutationFn: (id: string) => archivageService.toggleStore(id),
    meta: { successMessage: 'Connexion cloud mise à jour' },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['archivage', 'stores'] }),
  });
  const toggleRetention = useMutation({
    mutationFn: (id: string) => archivageService.toggleRetention(id),
    meta: { successMessage: 'Rétention légale mise à jour' },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['archivage', 'archives'] }),
  });

  return (
    <div className="space-y-5">
      <PageHeader title="Archivage GED" subtitle="Rétention légale (OHADA), scellement et stockage cloud." />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-0">
          <div className="p-5 pb-2"><CardTitle>Connexions cloud d'archivage</CardTitle></div>
          <ul className="divide-y divide-surface-border">
            {(stores ?? []).map((s, i) => (
              <li key={s.id} className="flex items-center justify-between gap-3 px-5 py-3 animate-row" style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}>
                <div className="flex items-center gap-2">
                  {s.type === 'LOCAL' ? <HardDrive size={18} className="text-ink-muted" /> : <Cloud size={18} className="text-brand-600" />}
                  <div>
                    <div className="font-medium text-ink">{s.nom}</div>
                    <div className="text-xs text-ink-subtle">{STORE_LABEL[s.type]}{s.parDefaut ? ' · défaut' : ''}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={s.actif ? 'success' : 'neutral'} dot>{s.actif ? 'Actif' : 'Inactif'}</Badge>
                  <Button size="sm" variant="secondary" disabled={toggleStore.isPending} onClick={() => toggleStore.mutate(s.id)}>
                    {s.actif ? 'Désactiver' : 'Activer'}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-0">
          <div className="p-5 pb-2"><CardTitle>Politiques de rétention</CardTitle></div>
          <ul className="divide-y divide-surface-border">
            {(politiques ?? []).map((p, i) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3 animate-row" style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}>
                <div>
                  <div className="font-medium text-ink">{p.nom}</div>
                  <div className="text-xs text-ink-subtle">{p.dureeConservationMois} mois · {p.actionEcheance === 'PURGER' ? 'purge à l’échéance' : 'conservation'}</div>
                </div>
                <ShieldCheck size={16} className="text-ink-subtle" />
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="p-0">
        <div className="p-5 pb-2"><CardTitle>Documents archivés</CardTitle></div>
        {isLoading ? (
          <SkeletonRows rows={3} cols={4} />
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-surface-border bg-surface-muted text-left text-xs uppercase tracking-wide text-ink-subtle">
              <tr>
                <th className="px-5 py-2.5 font-medium">Document</th>
                <th className="hidden px-5 py-2.5 font-medium sm:table-cell">Rétention</th>
                <th className="px-5 py-2.5 font-medium">Statut</th>
                <th className="px-5 py-2.5 text-right font-medium">Rétention légale</th>
              </tr>
            </thead>
            <tbody>
              {(archives ?? []).map((a, i) => (
                <tr key={a.id} className="border-b border-surface-border last:border-0 animate-row" style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}>
                  <td className="px-5 py-3">
                    <div className="font-medium text-ink">{a.documentNom}</div>
                    <div className="text-xs text-ink-subtle">{a.storeNom} · {a.tailleKo} Ko · archivé {a.archivedAt}</div>
                  </td>
                  <td className="hidden px-5 py-3 text-ink-muted sm:table-cell">jusqu'au {a.retentionUntil ?? '—'}</td>
                  <td className="px-5 py-3"><Badge tone={ARCHIVE_TONE[a.statut]} dot>{ARCHIVE_LABEL[a.statut]}</Badge></td>
                  <td className="px-5 py-3 text-right">
                    <Button size="sm" variant="ghost" disabled={toggleRetention.isPending} onClick={() => toggleRetention.mutate(a.id)}>
                      {a.retentionLegale ? <><LockOpen size={14} /> Lever</> : <><Lock size={14} /> Poser</>}
                    </Button>
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
