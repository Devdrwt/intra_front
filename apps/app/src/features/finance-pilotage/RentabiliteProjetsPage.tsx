import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { USE_MOCKS } from '@/lib/config';
import { FolderKanban } from 'lucide-react';
import { Badge, Card, EmptyState, PageHeader, SkeletonRows, cn } from '@drwindesk/ui';
import { fcfa } from '@/lib/money';

/**
 * Rentabilité par projet (cf. docs/contracts/finance-pilotage.md + lien projet).
 * Agrège entrées (factures encaissées) − sorties (frais/achats) rattachées au projet → marge.
 * Réel : GET /finance/dashboard/rentabilite-projets. Mock sinon.
 */
interface RentabiliteProjet {
  projetId: string;
  projetNom: string;
  entrees: number;
  sorties: number;
  marge: number;
}

const delay = <T,>(value: T, ms = 150): Promise<T> => new Promise((r) => setTimeout(() => r(value), ms));

const MOCK: RentabiliteProjet[] = [
  { projetId: 'p1', projetNom: 'Refonte SI Mairie', entrees: 8_500_000, sorties: 5_200_000, marge: 3_300_000 },
  { projetId: 'p2', projetNom: 'Podcast Tech au Bénin', entrees: 1_200_000, sorties: 1_450_000, marge: -250_000 },
  { projetId: 'p3', projetNom: 'Maintenance MTN', entrees: 2_360_000, sorties: 900_000, marge: 1_460_000 },
];

function fetchRentabilite(): Promise<RentabiliteProjet[]> {
  if (USE_MOCKS.finance) return delay(MOCK);
  return api.get<RentabiliteProjet[]>('/finance/dashboard/rentabilite-projets').then((r) => r.data);
}

export function RentabiliteProjetsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['finance', 'rentabilite-projets'], queryFn: fetchRentabilite });

  return (
    <div className="space-y-5">
      <PageHeader title="Rentabilité par projet" subtitle="Entrées − sorties rattachées à chaque projet = marge." />

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <SkeletonRows rows={4} cols={4} />
        ) : !data || data.length === 0 ? (
          <EmptyState icon={<FolderKanban size={20} />} title="Aucun projet" description="Rattachez des factures et frais à des projets pour voir leur marge." />
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-surface-border bg-surface-muted text-left text-xs uppercase tracking-wide text-ink-subtle">
              <tr>
                <th className="px-5 py-2.5 font-medium">Projet</th>
                <th className="px-5 py-2.5 text-right font-medium">Entrées</th>
                <th className="px-5 py-2.5 text-right font-medium">Sorties</th>
                <th className="px-5 py-2.5 text-right font-medium">Marge</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p, i) => (
                <tr key={p.projetId} className="border-b border-surface-border last:border-0 animate-row" style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}>
                  <td className="px-5 py-3 font-medium text-ink">{p.projetNom}</td>
                  <td className="px-5 py-3 text-right text-success">{fcfa(p.entrees)}</td>
                  <td className="px-5 py-3 text-right text-danger">{fcfa(p.sorties)}</td>
                  <td className="px-5 py-3 text-right">
                    <Badge tone={p.marge >= 0 ? 'success' : 'danger'}>
                      <span className={cn('font-semibold')}>{p.marge >= 0 ? '+' : ''}{fcfa(p.marge)}</span>
                    </Badge>
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
