import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Banknote, LifeBuoy, TrendingDown, TrendingUp, Users, Wallet } from 'lucide-react';
import { Badge, Card, CardTitle, PageHeader, SkeletonRows, cn } from '@drwindesk/ui';
import { fcfaCompact } from '@/lib/money';
import { pilotageService } from '@/features/finance-pilotage/service';

/**
 * Cockpit direction (cf. docs/contracts/experience.md) — compose les dashboards finance
 * + stats RH/support. GET /direction/cockpit en réel ; ici on agrège les sources mock.
 */
export function CockpitPage() {
  const { data: dash, isLoading } = useQuery({ queryKey: ['finance', 'dashboard'], queryFn: pilotageService.dashboard });
  const { data: budgets } = useQuery({ queryKey: ['finance', 'budgets-suivi'], queryFn: pilotageService.budgets });

  // RH / support : valeurs de démo (à brancher sur /direction/cockpit côté backend).
  const effectif = 48;
  const departsPrevus = 2;
  const ticketsOuverts = 12;
  const slaDepasses = 1;

  if (isLoading || !dash) return <Card className="p-0"><SkeletonRows rows={4} cols={4} /></Card>;

  const cards = [
    { label: 'Trésorerie', value: fcfaCompact(dash.tresorerie), icon: Banknote, tone: 'text-success', sub: '3 comptes' },
    { label: 'Résultat (mois)', value: fcfaCompact(dash.resultat), icon: dash.resultat >= 0 ? TrendingUp : TrendingDown, tone: dash.resultat >= 0 ? 'text-success' : 'text-danger', sub: 'produits − charges' },
    { label: 'Effectif', value: `${effectif}`, icon: Users, tone: 'text-ink', sub: `${departsPrevus} départs prévus` },
    { label: 'Support', value: `${ticketsOuverts} tickets`, icon: LifeBuoy, tone: 'text-ink', sub: `${slaDepasses} SLA dépassé` },
    { label: 'À encaisser', value: fcfaCompact(dash.creancesDues), icon: Wallet, tone: 'text-ink', sub: `${fcfaCompact(dash.creancesEnRetard)} en retard` },
    { label: 'Masse salariale', value: fcfaCompact(dash.masseSalariale), icon: Users, tone: 'text-ink', sub: '/ mois' },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Cockpit direction" subtitle="Vue consolidée — finance, RH et activité en temps réel." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label}>
            <div className="flex items-center gap-2 text-ink-muted"><c.icon size={18} /><span className="text-xs">{c.label}</span></div>
            <div className={cn('mt-2 text-2xl font-bold', c.tone)}>{c.value}</div>
            <div className="text-xs text-ink-subtle">{c.sub}</div>
          </Card>
        ))}
      </div>

      <Card>
        <CardTitle>Budgets</CardTitle>
        <div className="mt-4 space-y-3">
          {(budgets ?? []).map((b) => {
            const pct = Math.min(100, Math.round(b.consommation * 100));
            return (
              <div key={b.cibleLabel}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-ink">{b.cibleLabel}</span>
                  <span className="flex items-center gap-2 text-ink-muted">
                    {pct}%{b.depasse && <Badge tone="danger" dot><AlertTriangle size={11} /> Dépassé</Badge>}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                  <div className={cn('h-full rounded-full', b.depasse ? 'bg-danger' : pct > 85 ? 'bg-warning' : 'bg-brand-500')} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
