import { useEffect, useState } from 'react';
import { CheckCircle2, FileDown, FileText, PlayCircle, Wallet } from 'lucide-react';
import { Badge, Button, Callout, Card, CardTitle, Modal, PageHeader, SkeletonRows, Spinner, cn } from '@drwindesk/ui';
import type { BadgeProps } from '@drwindesk/ui';
import { fcfa } from '@/lib/money';
import {
  useBulletins,
  useGenererPeriode,
  usePayerBulletin,
  usePeriodesPaie,
  useValiderPeriode,
} from './hooks';
import { paieService, type DeclarationCnss, type DeclarationIts } from './service';
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
  const [decl, setDecl] = useState<{ type: 'CNSS' | 'ITS'; periode: { id: string; label: string } } | null>(null);
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
            {(periodes ?? []).map((p, i) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 animate-row" style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}>
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
                  {p.statut !== 'BROUILLON' && (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => setDecl({ type: 'CNSS', periode: { id: p.id, label: `${MOIS_LABEL[p.mois]} ${p.annee}` } })}>
                        CNSS
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setDecl({ type: 'ITS', periode: { id: p.id, label: `${MOIS_LABEL[p.mois]} ${p.annee}` } })}>
                        ITS
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => void paieService.exportCsv(p.id, `paie_${p.annee}-${String(p.mois).padStart(2, '0')}.csv`)}>
                        <FileDown size={14} /> CSV
                      </Button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {selected && <BulletinsCard periodeId={selected} />}
      {decl && <DeclarationModal type={decl.type} periodeId={decl.periode.id} periodeLabel={decl.periode.label} onClose={() => setDecl(null)} />}
    </div>
  );
}

function DeclarationModal({ type, periodeId, periodeLabel, onClose }: { type: 'CNSS' | 'ITS'; periodeId: string; periodeLabel: string; onClose: () => void }) {
  const [cnss, setCnss] = useState<DeclarationCnss | null>(null);
  const [its, setIts] = useState<DeclarationIts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (type === 'CNSS' ? paieService.declarationCnss(periodeId) : paieService.declarationIts(periodeId))
      .then((d) => { if (!alive) return; if (type === 'CNSS') setCnss(d as DeclarationCnss); else setIts(d as DeclarationIts); })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [type, periodeId]);

  return (
    <Modal open onClose={onClose} size="lg" title={`Déclaration ${type} — ${periodeLabel}`}>
      {loading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : type === 'CNSS' && cnss ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-ink-subtle">
              <tr><th className="py-2">Employé</th><th>N° CNSS</th><th className="text-right">Assiette</th><th className="text-right">Sal.</th><th className="text-right">Pat.</th></tr>
            </thead>
            <tbody>
              {cnss.lignes.map((l) => (
                <tr key={l.employeId} className="border-t border-surface-border">
                  <td className="py-2 font-medium text-ink">{l.employeNom}</td>
                  <td className="text-ink-muted">{l.numeroCnss ?? '—'}</td>
                  <td className="text-right text-ink-muted">{fcfa(l.assietteCotisable)}</td>
                  <td className="text-right text-ink-muted">{fcfa(l.cnssSalariale)}</td>
                  <td className="text-right text-ink-muted">{fcfa(l.cnssPatronale)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-surface-border font-semibold text-ink">
                <td className="py-2" colSpan={2}>Total</td>
                <td className="text-right">{fcfa(cnss.totaux.assietteCotisable)}</td>
                <td className="text-right">{fcfa(cnss.totaux.cnssSalariale)}</td>
                <td className="text-right">{fcfa(cnss.totaux.cnssPatronale)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : its ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-ink-subtle">
              <tr><th className="py-2">Employé</th><th className="text-right">Assiette imposable</th><th className="text-right">ITS retenu</th></tr>
            </thead>
            <tbody>
              {its.lignes.map((l) => (
                <tr key={l.employeId} className="border-t border-surface-border">
                  <td className="py-2 font-medium text-ink">{l.employeNom}</td>
                  <td className="text-right text-ink-muted">{fcfa(l.assietteImposable)}</td>
                  <td className="text-right text-ink-muted">{fcfa(l.itsRetenu)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-surface-border font-semibold text-ink">
                <td className="py-2">Total</td><td />
                <td className="text-right">{fcfa(its.total.itsRetenu)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : null}
    </Modal>
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
          {(bulletins ?? []).map((b, i) => (
            <tr key={b.id} className="border-b border-surface-border last:border-0 animate-row" style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}>
              <td className="px-5 py-3 font-medium text-ink">{b.employeNom}</td>
              <td className="hidden px-5 py-3 text-ink-muted sm:table-cell">{fcfa(b.salaireBrut)}</td>
              <td className="px-5 py-3 font-semibold text-ink">{fcfa(b.netAPayer)}</td>
              <td className="px-5 py-3"><Badge tone={BTONE[b.statut]} dot>{STATUT_BULLETIN_LABEL[b.statut]}</Badge></td>
              <td className={cn('px-5 py-3 text-right')}>
                <Button size="sm" variant="ghost" onClick={() => void paieService.bulletinPdf(b.id, `bulletin_${b.employeNom}.pdf`)} title="PDF du bulletin">
                  <FileText size={14} />
                </Button>
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
