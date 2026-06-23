import { Palmtree } from 'lucide-react';
import { Card, CardTitle, Skeleton } from '@drwindesk/ui';
import { useMySolde } from '@/features/me/hooks';

/** Mon solde de congés : jours pris cette année vs droit annuel (autoritatif serveur). */
export function SoldeCongesCard() {
  const { data, isLoading } = useMySolde();

  if (isLoading) {
    return (
      <Card>
        <CardTitle>Mon solde de congés</CardTitle>
        <Skeleton className="mt-4 h-12 w-full rounded-lg" />
      </Card>
    );
  }
  if (!data) return null;

  const { allowance, pris, restants } = data;
  const pct = allowance > 0 ? Math.min(100, Math.round((pris / allowance) * 100)) : 0;

  return (
    <Card>
      <div className="flex items-center gap-2">
        <Palmtree size={18} className="text-emerald-500" />
        <CardTitle>Mon solde de congés</CardTitle>
      </div>
      <div className="mt-4">
        <div className="flex items-end justify-between">
          <span className="text-sm text-ink-muted">
            Pris : <span className="font-semibold text-ink">{pris} j</span>
          </span>
          <span className="text-sm text-ink-muted">
            Restants : <span className="font-semibold text-ink">{restants} j</span>
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
          <div className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-teal-600 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1 text-xs text-ink-subtle">Sur {allowance} jours ouvrables / an</p>
      </div>
    </Card>
  );
}
