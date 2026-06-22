import { Link } from 'react-router-dom';
import { Card, CardTitle, cn } from '@drwindesk/ui';
import { useEmployes } from '@/features/rh/hooks';
import { useConges, usePointagesDuJour } from './hooks';

const today = () => new Date().toISOString().slice(0, 10);

/** Répartition de la présence du jour (présents / en congé / non pointés) en barres %. */
export function PresenceRepartitionCard() {
  const { data: pointages } = usePointagesDuJour();
  const { data: employes } = useEmployes({});
  const { data: conges } = useConges();

  const total = employes?.length ?? 0;
  const presents = (pointages ?? []).filter((p) => p.heureEntree).length;
  const t = today();
  const enConge = new Set(
    (conges ?? [])
      .filter(
        (c) =>
          c.statut === 'APPROUVE' &&
          (c.categorie === 'CONGE' || c.categorie === 'PERMISSION') &&
          c.dateDebut &&
          c.dateFin &&
          c.dateDebut <= t &&
          t <= c.dateFin,
      )
      .map((c) => c.employeId),
  ).size;
  const nonPointes = Math.max(0, total - presents - enConge);

  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
  const rows = [
    { label: 'Présents', n: presents, bar: 'bg-success', text: 'text-success' },
    { label: 'En congé / absence', n: enConge, bar: 'bg-brand-500', text: 'text-brand-600' },
    { label: 'Non pointés', n: nonPointes, bar: 'bg-warning', text: 'text-warning' },
  ];

  return (
    <Card>
      <div className="flex items-center justify-between">
        <CardTitle>Présence du jour</CardTitle>
        <Link to="/presences" className="text-sm font-medium text-brand-600 hover:underline">
          Détail
        </Link>
      </div>
      <p className="mt-1 text-sm text-ink-subtle">{total} collaborateur{total > 1 ? 's' : ''} actif{total > 1 ? 's' : ''}</p>

      <div className="mt-4 space-y-3">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-ink-muted">{r.label}</span>
              <span className={cn('font-semibold tabular-nums', r.text)}>
                {r.n} · {pct(r.n)}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
              <div className={cn('h-2 rounded-full transition-all duration-500', r.bar)} style={{ width: `${pct(r.n)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
