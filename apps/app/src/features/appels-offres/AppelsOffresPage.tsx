import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, FileSignature, Megaphone, Plus, X } from 'lucide-react';
import { Badge, Button, Card, CardTitle, Input, SkeletonRows } from '@drwindesk/ui';
import type { BadgeProps } from '@drwindesk/ui';
import { fcfa } from '@/lib/money';
import { commercialService, type AaoInput, type StatutAao, type StatutSoumission } from './service';

const AAO_TONE: Record<StatutAao, NonNullable<BadgeProps['tone']>> = { REPERE: 'neutral', A_SOUMETTRE: 'brand', ECARTE: 'neutral' };
const AAO_LABEL: Record<StatutAao, string> = { REPERE: 'Repéré', A_SOUMETTRE: 'On y va', ECARTE: 'Écarté' };
const SOUM_TONE: Record<StatutSoumission, NonNullable<BadgeProps['tone']>> = {
  EN_PREPARATION: 'warning', DEPOSEE: 'brand', GAGNEE: 'success', PERDUE: 'danger', INFRUCTUEUSE: 'neutral',
};
const SOUM_LABEL: Record<StatutSoumission, string> = {
  EN_PREPARATION: 'En préparation', DEPOSEE: 'Déposée', GAGNEE: 'Gagnée', PERDUE: 'Perdue', INFRUCTUEUSE: 'Infructueuse',
};

function echeance(date?: string) {
  if (!date) return null;
  const d = Math.round((new Date(date).getTime() - Date.now()) / 86_400_000);
  if (Number.isNaN(d)) return null;
  if (d < 0) return <Badge tone="danger" dot>Clôturé</Badge>;
  if (d <= 3) return <Badge tone="warning" dot>J-{d}</Badge>;
  return <Badge tone="neutral">J-{d}</Badge>;
}

export function AppelsOffresPage() {
  const qc = useQueryClient();
  const { data: aaos, isLoading } = useQuery({ queryKey: ['commercial', 'aao'], queryFn: commercialService.listAao });
  const { data: soumissions } = useQuery({ queryKey: ['commercial', 'soumissions'], queryFn: commercialService.listSoumissions });
  const decision = useMutation({
    mutationFn: ({ id, statut }: { id: string; statut: StatutAao }) => commercialService.decision(id, statut),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['commercial'] }),
  });
  const resultat = useMutation({
    mutationFn: ({ id, statut }: { id: string; statut: StatutSoumission }) => commercialService.resultat(id, statut),
    meta: { successMessage: 'Résultat enregistré' },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['commercial'] }),
  });
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-ink">Appels d'offres</h2>
          <p className="text-ink-muted">Veille des avis, dossiers (DAO) et soumissions.</p>
        </div>
        <Button onClick={() => setOpen((v) => !v)} variant={open ? 'secondary' : 'primary'}>
          {open ? <X size={18} /> : <Plus size={18} />} {open ? 'Fermer' : 'Nouvel avis'}
        </Button>
      </header>

      {open && <AaoForm onDone={() => setOpen(false)} />}

      {(soumissions ?? []).length > 0 && (
        <Card className="p-0">
          <div className="p-5 pb-2"><CardTitle>Soumissions en cours</CardTitle></div>
          <ul className="divide-y divide-surface-border">
            {(soumissions ?? []).map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div className="flex items-center gap-2">
                  <FileSignature size={16} className="text-ink-muted" />
                  <div>
                    <div className="font-medium text-ink">{s.aaoObjet}</div>
                    <div className="text-xs text-ink-subtle">{s.montantPropose ? `Proposé : ${fcfa(s.montantPropose)}` : '—'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={SOUM_TONE[s.statut]} dot>{SOUM_LABEL[s.statut]}</Badge>
                  {s.statut === 'DEPOSEE' && (
                    <>
                      <Button size="sm" disabled={resultat.isPending} onClick={() => resultat.mutate({ id: s.id, statut: 'GAGNEE' })}>Gagnée</Button>
                      <Button size="sm" variant="ghost" disabled={resultat.isPending} onClick={() => resultat.mutate({ id: s.id, statut: 'PERDUE' })}>Perdue</Button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <CardTitle>Veille — avis d'appel d'offres</CardTitle>
      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <SkeletonRows rows={3} cols={4} />
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-surface-border bg-surface-muted text-left text-xs uppercase tracking-wide text-ink-subtle">
              <tr>
                <th className="px-5 py-2.5 font-medium">Avis</th>
                <th className="hidden px-5 py-2.5 font-medium sm:table-cell">Échéance</th>
                <th className="px-5 py-2.5 font-medium">Statut</th>
                <th className="px-5 py-2.5 text-right font-medium">Décision</th>
              </tr>
            </thead>
            <tbody>
              {(aaos ?? []).map((a) => (
                <tr key={a.id} className="border-b border-surface-border last:border-0">
                  <td className="px-5 py-3">
                    <div className="font-medium text-ink">{a.objet}</div>
                    <div className="text-xs text-ink-subtle">{a.reference}{a.bailleur ? ` · ${a.bailleur}` : ''}{a.montantEstime ? ` · ~${fcfa(a.montantEstime)}` : ''}</div>
                  </td>
                  <td className="hidden px-5 py-3 sm:table-cell">{echeance(a.dateLimite)}</td>
                  <td className="px-5 py-3"><Badge tone={AAO_TONE[a.statut]} dot>{AAO_LABEL[a.statut]}</Badge></td>
                  <td className="px-5 py-3 text-right">
                    {a.statut === 'REPERE' && (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" disabled={decision.isPending} onClick={() => decision.mutate({ id: a.id, statut: 'A_SOUMETTRE' })}>
                          <Check size={14} /> On y va
                        </Button>
                        <Button size="sm" variant="ghost" disabled={decision.isPending} onClick={() => decision.mutate({ id: a.id, statut: 'ECARTE' })}>
                          Passer
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {(aaos ?? []).length === 0 && (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-ink-subtle"><Megaphone size={20} className="mx-auto mb-1 opacity-50" />Aucun avis pour l'instant.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function AaoForm({ onDone }: { onDone: () => void }) {
  const qc = useQueryClient();
  const create = useMutation({
    mutationFn: (input: AaoInput) => commercialService.createAao(input),
    meta: { successMessage: 'Avis ajouté' },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['commercial'] }); onDone(); },
  });
  const [objet, setObjet] = useState('');
  const [bailleur, setBailleur] = useState('');
  const [dateLimite, setDateLimite] = useState('');
  const [montant, setMontant] = useState('');

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!objet.trim()) return;
    create.mutate({ objet: objet.trim(), bailleur: bailleur || undefined, dateLimite: dateLimite || undefined, montantEstime: montant ? Number(montant) : undefined });
  };

  return (
    <Card>
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        <Input id="objet" label="Objet *" value={objet} onChange={(e) => setObjet(e.target.value)} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Input id="bailleur" label="Bailleur / client" value={bailleur} onChange={(e) => setBailleur(e.target.value)} />
          <Input id="date" type="date" label="Date limite" value={dateLimite} onChange={(e) => setDateLimite(e.target.value)} />
          <Input id="montant" type="number" label="Montant estimé (F)" value={montant} onChange={(e) => setMontant(e.target.value)} />
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onDone}>Annuler</Button>
          <Button type="submit" loading={create.isPending}>Ajouter</Button>
        </div>
      </form>
    </Card>
  );
}
