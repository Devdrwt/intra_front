import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Banknote, Receipt, TrendingDown, TrendingUp, Users } from 'lucide-react';
import { Badge, Card, CardTitle, PageHeader, SkeletonRows, cn } from '@drwindesk/ui';
import { fcfaCompact } from '@/lib/money';
import { pilotageService } from './service';

export function PilotagePage() {
  const { data: dash, isLoading } = useQuery({ queryKey: ['finance', 'dashboard'], queryFn: pilotageService.dashboard });
  const { data: budgets } = useQuery({ queryKey: ['finance', 'budgets-suivi'], queryFn: pilotageService.budgets });

  if (isLoading || !dash) return <Card className="p-0"><SkeletonRows rows={4} cols={3} /></Card>;

  const kpis = [
    { label: 'Trésorerie', value: fcfaCompact(dash.tresorerie), icon: Banknote, tone: 'text-success' },
    { label: 'Résultat (mois)', value: fcfaCompact(dash.resultat), icon: dash.resultat >= 0 ? TrendingUp : TrendingDown, tone: dash.resultat >= 0 ? 'text-success' : 'text-danger' },
    { label: 'À encaisser', value: fcfaCompact(dash.creancesDues), icon: Receipt, tone: 'text-ink', sub: dash.creancesEnRetard > 0 ? `dont ${fcfaCompact(dash.creancesEnRetard)} en retard` : undefined },
    { label: 'À payer (fourn.)', value: fcfaCompact(dash.dettes), icon: Receipt, tone: 'text-ink' },
    { label: 'Masse salariale', value: fcfaCompact(dash.masseSalariale), icon: Users, tone: 'text-ink' },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Budgets & pilotage" subtitle="Cockpit financier — trésorerie, résultat, créances, budgets." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((k) => (
          <Card key={k.label}>
            <div className="flex items-center gap-2 text-ink-muted"><k.icon size={18} /><span className="text-xs">{k.label}</span></div>
            <div className={cn('mt-2 text-xl font-bold', k.tone)}>{k.value}</div>
            {k.sub && <div className="text-xs text-ink-subtle">{k.sub}</div>}
          </Card>
        ))}
      </div>

      <Card>
        <CardTitle>Budget vs réalisé</CardTitle>
        <div className="mt-4 space-y-4">
          {(budgets ?? []).map((b) => {
            const pct = Math.min(100, Math.round(b.consommation * 100));
            return (
              <div key={b.cibleLabel}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-ink">{b.cibleLabel}</span>
                  <span className="flex items-center gap-2 text-ink-muted">
                    {fcfaCompact(b.realise)} / {fcfaCompact(b.prevu)}
                    {b.depasse && <Badge tone="danger" dot><AlertTriangle size={11} /> Dépassé</Badge>}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className={cn('h-full rounded-full', b.depasse ? 'bg-danger' : pct > 85 ? 'bg-warning' : 'bg-brand-500')}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
          {(budgets ?? []).length === 0 && <p className="text-sm text-ink-subtle">Aucun budget défini.</p>}
        </div>
      </Card>
    </div>
  );
}
