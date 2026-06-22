import { useState, type FormEvent } from 'react';
import { FileText, Plus, Send, Wallet, X } from 'lucide-react';
import { Badge, Button, Callout, Card, EmptyState, Input, PageHeader, SkeletonRows } from '@drwindesk/ui';
import type { BadgeProps } from '@drwindesk/ui';
import { apiErrorMessage } from '@/lib/api';
import { fcfa } from '@/lib/money';
import { useCreateFacture, useEmettreFacture, useEncaisser, useFacturesClient } from './hooks';
import { STATUT_FC_LABEL, type FactureClientInput, type StatutFactureClient } from './types';

const TONE: Record<StatutFactureClient, NonNullable<BadgeProps['tone']>> = {
  BROUILLON: 'neutral',
  EMISE: 'warning',
  PARTIELLEMENT_PAYEE: 'brand',
  PAYEE: 'success',
  ANNULEE: 'danger',
};

function retard(f: { dateEcheance?: string; statut: StatutFactureClient }) {
  if (!f.dateEcheance || f.statut === 'PAYEE' || f.statut === 'BROUILLON') return null;
  const days = Math.round((new Date(f.dateEcheance).getTime() - Date.now()) / 86_400_000);
  if (Number.isNaN(days) || days >= 0) return null;
  return <Badge tone="danger" dot>Retard {Math.abs(days)} j</Badge>;
}

export function FacturesClientPage() {
  const { data: factures, isLoading } = useFacturesClient();
  const emettre = useEmettreFacture();
  const encaisser = useEncaisser();
  const [open, setOpen] = useState(false);

  const onEncaisser = (id: string, reste: number) => {
    const raw = prompt(`Montant encaissé (reste ${fcfa(reste)}) :`, String(reste));
    const montant = Number(raw);
    if (montant > 0) encaisser.mutate({ id, input: { montant, mode: 'MOBILE_MONEY' } });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Factures client"
        subtitle="Émission, encaissements et suivi des créances."
        actions={
          <Button onClick={() => setOpen((v) => !v)} variant={open ? 'secondary' : 'primary'}>
            {open ? <X size={18} /> : <Plus size={18} />} {open ? 'Fermer' : 'Nouvelle facture'}
          </Button>
        }
      />

      {open && <CreatePanel onDone={() => setOpen(false)} />}

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <SkeletonRows rows={4} cols={4} />
        ) : !factures || factures.length === 0 ? (
          <EmptyState icon={<FileText size={20} />} title="Aucune facture" description="Créez votre première facture client." />
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-surface-border bg-surface-muted text-left text-xs uppercase tracking-wide text-ink-subtle">
              <tr>
                <th className="px-5 py-2.5 font-medium">Facture</th>
                <th className="px-5 py-2.5 font-medium">Montant</th>
                <th className="px-5 py-2.5 font-medium">Statut</th>
                <th className="px-5 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {factures.map((f) => {
                const reste = f.montantTtc - f.montantPaye;
                return (
                  <tr key={f.id} className="border-b border-surface-border last:border-0">
                    <td className="px-5 py-3">
                      <div className="font-medium text-ink">{f.clientNom}</div>
                      <div className="text-xs text-ink-subtle">{f.reference} · {f.objet}</div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-ink">{fcfa(f.montantTtc)}</div>
                      {f.montantPaye > 0 && f.montantPaye < f.montantTtc && (
                        <div className="text-xs text-ink-subtle">reste {fcfa(reste)}</div>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Badge tone={TONE[f.statut]} dot>{STATUT_FC_LABEL[f.statut]}</Badge>
                        {retard(f)}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {f.statut === 'BROUILLON' && (
                        <Button size="sm" disabled={emettre.isPending} onClick={() => emettre.mutate(f.id)}>
                          <Send size={14} /> Émettre
                        </Button>
                      )}
                      {(f.statut === 'EMISE' || f.statut === 'PARTIELLEMENT_PAYEE') && (
                        <Button size="sm" variant="secondary" disabled={encaisser.isPending} onClick={() => onEncaisser(f.id, reste)}>
                          <Wallet size={14} /> Encaisser
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function CreatePanel({ onDone }: { onDone: () => void }) {
  const create = useCreateFacture();
  const [clientNom, setClientNom] = useState('');
  const [objet, setObjet] = useState('');
  const [montantHt, setMontantHt] = useState('');
  const [dateEcheance, setDateEcheance] = useState('');
  const [error, setError] = useState<string | null>(null);

  const ht = Number(montantHt);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!clientNom.trim() || !objet.trim() || !ht || ht <= 0) return setError('Client, objet et montant requis.');
    try {
      const input: FactureClientInput = { clientId: 'mock', clientNom: clientNom.trim(), objet: objet.trim(), montantHt: ht, dateEcheance: dateEcheance || undefined };
      await create.mutateAsync(input);
      onDone();
    } catch (err) {
      setError(apiErrorMessage(err, 'Création impossible.'));
    }
  };

  return (
    <Card>
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input id="client" label="Client *" value={clientNom} onChange={(e) => setClientNom(e.target.value)} />
          <Input id="objet" label="Objet *" value={objet} onChange={(e) => setObjet(e.target.value)} />
        </div>
        <div className="grid items-end gap-4 sm:grid-cols-3">
          <Input id="ht" type="number" label="Montant HT (F) *" value={montantHt} onChange={(e) => setMontantHt(e.target.value)} />
          <Input id="ech" type="date" label="Échéance" value={dateEcheance} onChange={(e) => setDateEcheance(e.target.value)} />
          <p className="text-sm text-ink-muted">TTC (TVA 18 %) : <span className="font-medium text-ink">{fcfa(ht + Math.round(ht * 0.18))}</span></p>
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
