import { useState } from 'react';
import { CheckCircle2, PlayCircle, Wallet } from 'lucide-react';
import { Badge, Button, Callout, Card, CardTitle, PageHeader, SkeletonRows, cn } from '@drwindesk/ui';
import type { BadgeProps } from '@drwindesk/ui';
import { fcfa } from '@/lib/money';
import {
  useBulletins,
  useGenererPeriode,
  usePayerBulletin,
  usePeriodesPaie,
  useValiderPeriode,
} from './hooks';
import {
  MOIS_LABEL,
  STATUT_BULLETIN_LABEL,
  STATUT_PERIODE_LABEL,
  type StatutBulletin,
  type StatutPeriode,
} from './types';

const PTONE: Record<StatutPeriode, NonNullable<BadgeProps['tone']>> = {
  BROUILLON: 'neutral',
  VALIDEE: 'brand',
  PAYEE: 'success',
  CLOTUREE: 'neutral',
};
const BTONE: Record<StatutBulletin, NonNullable<BadgeProps['tone']>> = {
  BROUILLON: 'neutral',
  VALIDE: 'brand',
  PAYE: 'success',
};

export function PaiePage() {
  const { data: periodes, isLoading } = usePeriodesPaie();
  const [selected, setSelected] = useState<string | undefined>();
  const generer = useGenererPeriode();
  const valider = useValiderPeriode();

  return (
    <div className="space-y-5">
      <PageHeader title="Paie" subtitle="Périodes, bulletins et virement des salaires (Mobile Money manuel)." />

      <Callout tone="warning">
        Données sensibles. Les taux CNSS / ITS sont paramétrés côté backend et à valider avec un expert-paie avant production.
      </Callout>

      {isLoading ? (
        <Card className="p-0"><SkeletonRows rows={3} cols={3} /></Card>
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-surface-border">
            {(periodes ?? []).map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <button onClick={() => setSelected((v) => (v === p.id ? undefined : p.id))} className="text-left">
                  <div className="font-medium text-ink">{MOIS_LABEL[p.mois]} {p.annee}</div>
                  <div className="text-xs text-ink-subtle">{p.nbBulletins} bulletin(s) · net {fcfa(p.totalNet)}</div>
                </button>
                <div className="flex items-center gap-2">
                  <Badge tone={PTONE[p.statut]} dot>{STATUT_PERIODE_LABEL[p.statut]}</Badge>
                  {p.statut === 'BROUILLON' && (
                    <Button size="sm" variant="secondary" disabled={generer.isPending} onClick={() => generer.mutate(p.id)}>
                      <PlayCircle size={14} /> Générer
                    </Button>
                  )}
                  {p.statut === 'BROUILLON' && p.nbBulletins > 0 && (
                    <Button size="sm" disabled={valider.isPending} onClick={() => valider.mutate(p.id)}>
                      <CheckCircle2 size={14} /> Valider
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {selected && <BulletinsCard periodeId={selected} />}
    </div>
  );
}

function BulletinsCard({ periodeId }: { periodeId: string }) {
  const { data: bulletins } = useBulletins(periodeId);
  const payer = usePayerBulletin();

  const onPayer = (id: string) => {
    const ref = prompt('Référence du virement (n° MoMo) :');
    if (ref) payer.mutate({ id, paiementRef: ref });
  };

  return (
    <Card className="p-0">
      <div className="p-5 pb-2"><CardTitle>Bulletins de la période</CardTitle></div>
      <table className="w-full text-sm">
        <thead className="border-b border-surface-border bg-surface-muted text-left text-xs uppercase tracking-wide text-ink-subtle">
          <tr>
            <th className="px-5 py-2.5 font-medium">Employé</th>
            <th className="hidden px-5 py-2.5 font-medium sm:table-cell">Brut</th>
            <th className="px-5 py-2.5 font-medium">Net à payer</th>
            <th className="px-5 py-2.5 font-medium">Statut</th>
            <th className="px-5 py-2.5 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {(bulletins ?? []).map((b) => (
            <tr key={b.id} className="border-b border-surface-border last:border-0">
              <td className="px-5 py-3 font-medium text-ink">{b.employeNom}</td>
              <td className="hidden px-5 py-3 text-ink-muted sm:table-cell">{fcfa(b.salaireBrut)}</td>
              <td className="px-5 py-3 font-semibold text-ink">{fcfa(b.netAPayer)}</td>
              <td className="px-5 py-3"><Badge tone={BTONE[b.statut]} dot>{STATUT_BULLETIN_LABEL[b.statut]}</Badge></td>
              <td className={cn('px-5 py-3 text-right')}>
                {b.statut === 'VALIDE' && (
                  <Button size="sm" variant="secondary" disabled={payer.isPending} onClick={() => onPayer(b.id)}>
                    <Wallet size={14} /> Payer
                  </Button>
                )}
                {b.paiementRef && <span className="text-xs text-ink-subtle">réf {b.paiementRef}</span>}
              </td>
            </tr>
          ))}
          {(bulletins ?? []).length === 0 && (
            <tr><td colSpan={5} className="px-5 py-6 text-sm text-ink-subtle">Aucun bulletin — générez la période.</td></tr>
          )}
        </tbody>
      </table>
    </Card>
  );
}
