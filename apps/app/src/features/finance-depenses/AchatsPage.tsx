import { FileText, Wallet } from 'lucide-react';
import { Badge, Button, Card, EmptyState, PageHeader, SkeletonRows } from '@drwindesk/ui';
import type { BadgeProps } from '@drwindesk/ui';
import { fcfa } from '@/lib/money';
import { PiecesJointesButton } from '@/features/pieces-jointes/PiecesJointesButton';
import { useFacturesFournisseur, usePayerFacture } from './hooks';
import { STATUT_FF_LABEL, type StatutFactureFourn } from './types';

const TONE: Record<StatutFactureFourn, NonNullable<BadgeProps['tone']>> = {
  A_PAYER: 'warning',
  PARTIELLEMENT_PAYEE: 'brand',
  PAYEE: 'success',
};

function echeanceBadge(date?: string) {
  if (!date) return null;
  const days = Math.round((new Date(date).getTime() - Date.now()) / 86_400_000);
  if (Number.isNaN(days)) return null;
  if (days < 0) return <Badge tone="danger" dot>En retard</Badge>;
  if (days <= 7) return <Badge tone="warning">J+{days}</Badge>;
  return <Badge tone="neutral">J+{days}</Badge>;
}

export function AchatsPage() {
  const { data: factures, isLoading } = useFacturesFournisseur();
  const payer = usePayerFacture();

  const onPayer = (id: string, montantTtc: number, dejaPaye: number) => {
    const reste = montantTtc - dejaPaye;
    const raw = prompt(`Montant à régler (reste ${fcfa(reste)}) :`, String(reste));
    if (!raw) return;
    const m = Number(raw.replace(/\s/g, ''));
    if (!Number.isFinite(m) || m <= 0) return;
    payer.mutate({ id, montantPaye: dejaPaye + m });
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Achats & fournisseurs" subtitle="Factures fournisseurs et échéancier des dettes." />

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <SkeletonRows rows={4} cols={4} />
        ) : !factures || factures.length === 0 ? (
          <EmptyState icon={<FileText size={20} />} title="Aucune facture fournisseur" description="Les factures à payer apparaîtront ici." />
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-surface-border bg-surface-muted text-left text-xs uppercase tracking-wide text-ink-subtle">
              <tr>
                <th className="px-5 py-2.5 font-medium">Facture</th>
                <th className="hidden px-5 py-2.5 font-medium sm:table-cell">Échéance</th>
                <th className="px-5 py-2.5 font-medium">Montant</th>
                <th className="px-5 py-2.5 font-medium">Statut</th>
                <th className="px-5 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {factures.map((f, i) => (
                <tr key={f.id} className="border-b border-surface-border last:border-0 animate-row" style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}>
                  <td className="px-5 py-3">
                    <div className="font-medium text-ink">{f.fournisseurNom}</div>
                    <div className="text-xs text-ink-subtle">{f.reference}{f.numeroFournisseur ? ` · n° ${f.numeroFournisseur}` : ''}</div>
                  </td>
                  <td className="hidden px-5 py-3 sm:table-cell">{echeanceBadge(f.dateEcheance)}</td>
                  <td className="px-5 py-3">
                    <div className="font-medium text-ink">{fcfa(f.montantTtc)}</div>
                    {f.montantPaye > 0 && f.montantPaye < f.montantTtc && (
                      <div className="text-xs text-ink-subtle">payé {fcfa(f.montantPaye)}</div>
                    )}
                  </td>
                  <td className="px-5 py-3"><Badge tone={TONE[f.statut]} dot>{STATUT_FF_LABEL[f.statut]}</Badge></td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {f.statut !== 'PAYEE' && (
                        <Button size="sm" variant="secondary" disabled={payer.isPending} onClick={() => onPayer(f.id, f.montantTtc, f.montantPaye)}>
                          <Wallet size={14} /> Régler
                        </Button>
                      )}
                      <PiecesJointesButton
                        entityType="FACTURE_FOURNISSEUR"
                        entityId={f.id}
                        writePermission="finance:write"
                        title={`Pièces jointes — ${f.reference}`}
                      />
                    </div>
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
