import { Palmtree } from 'lucide-react';
import { Card, CardTitle } from '@drwindesk/ui';
import { useMyConges } from '@/features/me/hooks';
import { nbJours } from '@/features/presences/types';

const ALLOWANCE = 30; // jours/an (indicatif — paramétrable plus tard)

/** Mon solde de congés : jours pris cette année vs droit annuel. */
export function SoldeCongesCard() {
  const { data: conges } = useMyConges();
  const year = String(new Date().getFullYear());

  const pris = (conges ?? [])
    .filter(
      (c) =>
        c.statut === 'APPROUVE' &&
        (c.categorie ?? 'CONGE') === 'CONGE' &&
        typeof c.dateDebut === 'string' &&
        c.dateDebut.startsWith(year),
    )
    .reduce((s, c) => s + nbJours(c.dateDebut, c.dateFin), 0);

  const restants = Math.max(0, ALLOWANCE - pris);
  const pct = Math.min(100, Math.round((pris / ALLOWANCE) * 100));

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
        <p className="mt-1 text-xs text-ink-subtle">Sur {ALLOWANCE} jours / an (indicatif)</p>
      </div>
    </Card>
  );
}
