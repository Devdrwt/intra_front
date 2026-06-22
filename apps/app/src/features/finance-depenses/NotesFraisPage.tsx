import { useState, type FormEvent } from 'react';
import { Plus, Receipt, Send, Wallet, X } from 'lucide-react';
import { Badge, Button, Callout, Card, EmptyState, Input, PageHeader, SkeletonRows } from '@drwindesk/ui';
import type { BadgeProps } from '@drwindesk/ui';
import { apiErrorMessage } from '@/lib/api';
import { fcfa } from '@/lib/money';
import { useCreateNote, useNotesFrais, useRembourserNote, useSoumettreNote } from './hooks';
import { STATUT_NF_LABEL, type ModePaiement, type StatutNoteFrais } from './types';

const TONE: Record<StatutNoteFrais, NonNullable<BadgeProps['tone']>> = {
  BROUILLON: 'neutral',
  SOUMISE: 'warning',
  APPROUVEE: 'brand',
  REJETEE: 'danger',
  REMBOURSEE: 'success',
};

export function NotesFraisPage() {
  const { data: notes, isLoading } = useNotesFrais();
  const soumettre = useSoumettreNote();
  const rembourser = useRembourserNote();
  const [open, setOpen] = useState(false);

  const onRembourser = (id: string) => {
    const ref = prompt('Référence de paiement (n° MoMo / virement) :');
    if (ref) rembourser.mutate({ id, modePaiement: 'MOBILE_MONEY' as ModePaiement, paiementRef: ref });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notes de frais"
        subtitle="Saisie, validation et remboursement (Mobile Money manuel)."
        actions={
          <Button onClick={() => setOpen((v) => !v)} variant={open ? 'secondary' : 'primary'}>
            {open ? <X size={18} /> : <Plus size={18} />} {open ? 'Fermer' : 'Nouvelle note'}
          </Button>
        }
      />

      {open && <CreatePanel onDone={() => setOpen(false)} />}

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <SkeletonRows rows={4} cols={4} />
        ) : !notes || notes.length === 0 ? (
          <EmptyState icon={<Receipt size={20} />} title="Aucune note de frais" description="Créez votre première note." />
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-surface-border bg-surface-muted text-left text-xs uppercase tracking-wide text-ink-subtle">
              <tr>
                <th className="px-5 py-2.5 font-medium">Note</th>
                <th className="px-5 py-2.5 font-medium">Montant TTC</th>
                <th className="px-5 py-2.5 font-medium">Statut</th>
                <th className="px-5 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {notes.map((n) => (
                <tr key={n.id} className="border-b border-surface-border last:border-0">
                  <td className="px-5 py-3">
                    <div className="font-medium text-ink">{n.titre}</div>
                    <div className="text-xs text-ink-subtle">{n.reference}{n.paiementRef ? ` · réf ${n.paiementRef}` : ''}</div>
                  </td>
                  <td className="px-5 py-3 font-medium text-ink">{fcfa(n.montantTtc)}</td>
                  <td className="px-5 py-3"><Badge tone={TONE[n.statut]} dot>{STATUT_NF_LABEL[n.statut]}</Badge></td>
                  <td className="px-5 py-3 text-right">
                    {n.statut === 'BROUILLON' && (
                      <Button size="sm" disabled={soumettre.isPending} onClick={() => soumettre.mutate(n.id)}>
                        <Send size={14} /> Soumettre
                      </Button>
                    )}
                    {n.statut === 'APPROUVEE' && (
                      <Button size="sm" variant="secondary" disabled={rembourser.isPending} onClick={() => onRembourser(n.id)}>
                        <Wallet size={14} /> Rembourser
                      </Button>
                    )}
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

function CreatePanel({ onDone }: { onDone: () => void }) {
  const create = useCreateNote();
  const [titre, setTitre] = useState('');
  const [montantHt, setMontantHt] = useState('');
  const [error, setError] = useState<string | null>(null);

  const ht = Number(montantHt);
  const tva = Number.isNaN(ht) ? 0 : Math.round(ht * 0.18);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!titre.trim() || !ht || ht <= 0) return setError('Titre et montant HT requis.');
    try {
      await create.mutateAsync({ titre: titre.trim(), montantHt: ht });
      onDone();
    } catch (err) {
      setError(apiErrorMessage(err, 'Création impossible.'));
    }
  };

  return (
    <Card>
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        <Input id="titre" label="Objet *" value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Déplacement, fournitures…" />
        <div className="grid items-end gap-4 sm:grid-cols-2">
          <Input id="ht" type="number" label="Montant HT (F) *" value={montantHt} onChange={(e) => setMontantHt(e.target.value)} />
          <p className="text-sm text-ink-muted">TVA 18 % : <span className="font-medium text-ink">{fcfa(tva)}</span> · TTC : <span className="font-medium text-ink">{fcfa(ht + tva)}</span></p>
        </div>
        {error && <Callout tone="danger">{error}</Callout>}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onDone}>Annuler</Button>
          <Button type="submit" loading={create.isPending}>Créer (brouillon)</Button>
        </div>
      </form>
    </Card>
  );
}
