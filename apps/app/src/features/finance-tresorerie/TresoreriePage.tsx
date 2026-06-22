import { useState, type FormEvent } from 'react';
import { ArrowDownLeft, ArrowUpRight, Banknote, CreditCard, Plus, Smartphone, X } from 'lucide-react';
import { Badge, Button, Callout, Card, CardTitle, Input, PageHeader, Select, SkeletonRows, cn } from '@drwindesk/ui';
import { apiErrorMessage } from '@/lib/api';
import { fcfa } from '@/lib/money';
import { useComptesTresorerie, useCreateMouvement, useMouvements, useRapprocher } from './hooks';
import { TYPE_COMPTE_LABEL, type MouvementInput, type SensMouvement, type TypeCompteTresorerie } from './types';

const ICON: Record<TypeCompteTresorerie, typeof Banknote> = {
  CAISSE: Banknote,
  BANQUE: CreditCard,
  MOBILE_MONEY: Smartphone,
};

export function TresoreriePage() {
  const { data: comptes, isLoading } = useComptesTresorerie();
  const [selected, setSelected] = useState<string | undefined>();
  const { data: mouvements } = useMouvements(selected);
  const rapprocher = useRapprocher();
  const [open, setOpen] = useState(false);

  const total = (comptes ?? []).reduce((s, c) => s + c.solde, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Trésorerie"
        subtitle={<>Disponible total : <span className="font-semibold text-ink">{fcfa(total)}</span></>}
        actions={
          <Button onClick={() => setOpen((v) => !v)} variant={open ? 'secondary' : 'primary'}>
            {open ? <X size={18} /> : <Plus size={18} />} {open ? 'Fermer' : 'Mouvement'}
          </Button>
        }
      />

      {open && <MouvementPanel comptes={(comptes ?? []).map((c) => ({ value: c.id, label: c.nom }))} onDone={() => setOpen(false)} />}

      {isLoading ? (
        <Card className="p-0"><SkeletonRows rows={3} cols={2} /></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {(comptes ?? []).map((c) => {
            const Icon = ICON[c.type];
            const active = selected === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelected(active ? undefined : c.id)}
                className={cn(
                  'rounded-2xl border p-4 text-left transition-colors',
                  active ? 'border-brand-500 bg-brand-soft' : 'border-surface-border bg-surface-elevated hover:bg-surface-muted',
                )}
              >
                <div className="flex items-center gap-2 text-ink-muted">
                  <Icon size={18} /> <span className="text-xs">{TYPE_COMPTE_LABEL[c.type]}</span>
                </div>
                <div className="mt-2 text-lg font-bold text-ink">{fcfa(c.solde)}</div>
                <div className="truncate text-xs text-ink-subtle">{c.nom}</div>
              </button>
            );
          })}
        </div>
      )}

      <Card className="p-0">
        <div className="p-5 pb-2">
          <CardTitle>Mouvements {selected ? `— ${comptes?.find((c) => c.id === selected)?.nom}` : '(tous comptes)'}</CardTitle>
        </div>
        <ul className="divide-y divide-surface-border">
          {(mouvements ?? []).map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="flex items-center gap-3">
                <span className={cn('flex h-8 w-8 items-center justify-center rounded-full', m.sens === 'ENTREE' ? 'bg-success-soft text-success-soft-fg' : 'bg-danger-soft text-danger-soft-fg')}>
                  {m.sens === 'ENTREE' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-ink">{m.libelle}</div>
                  <div className="text-xs text-ink-subtle">{m.date} · {m.mode}{m.paiementRef ? ` · ${m.paiementRef}` : ''}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn('text-sm font-semibold', m.sens === 'ENTREE' ? 'text-success' : 'text-danger')}>
                  {m.sens === 'ENTREE' ? '+' : '−'}{fcfa(m.montant)}
                </span>
                {m.rapproche ? (
                  <Badge tone="success">rapproché</Badge>
                ) : (
                  <Button size="sm" variant="ghost" disabled={rapprocher.isPending} onClick={() => rapprocher.mutate(m.id)}>
                    Rapprocher
                  </Button>
                )}
              </div>
            </li>
          ))}
          {(mouvements ?? []).length === 0 && <li className="px-5 py-6 text-sm text-ink-subtle">Aucun mouvement.</li>}
        </ul>
      </Card>
    </div>
  );
}

function MouvementPanel({ comptes, onDone }: { comptes: { value: string; label: string }[]; onDone: () => void }) {
  const create = useCreateMouvement();
  const [compteId, setCompteId] = useState(comptes[0]?.value ?? '');
  const [sens, setSens] = useState<SensMouvement>('SORTIE');
  const [montant, setMontant] = useState('');
  const [libelle, setLibelle] = useState('');
  const [paiementRef, setPaiementRef] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const m = Number(montant);
    if (!compteId || !m || m <= 0 || !libelle.trim()) return setError('Compte, montant et libellé requis.');
    try {
      const input: MouvementInput = { compteId, sens, montant: m, libelle: libelle.trim(), mode: 'MANUEL', paiementRef: paiementRef || undefined };
      await create.mutateAsync(input);
      onDone();
    } catch (err) {
      setError(apiErrorMessage(err, 'Enregistrement impossible.'));
    }
  };

  return (
    <Card>
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select id="compte" label="Compte *" value={compteId} onChange={(e) => setCompteId(e.target.value)} options={comptes} />
          <Select id="sens" label="Sens *" value={sens} onChange={(e) => setSens(e.target.value as SensMouvement)} options={[{ value: 'SORTIE', label: 'Sortie' }, { value: 'ENTREE', label: 'Entrée' }]} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input id="montant" type="number" label="Montant (F) *" value={montant} onChange={(e) => setMontant(e.target.value)} />
          <Input id="ref" label="Réf. paiement (MoMo…)" value={paiementRef} onChange={(e) => setPaiementRef(e.target.value)} />
        </div>
        <Input id="lib" label="Libellé *" value={libelle} onChange={(e) => setLibelle(e.target.value)} />
        {error && <Callout tone="danger">{error}</Callout>}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onDone}>Annuler</Button>
          <Button type="submit" loading={create.isPending}>Enregistrer</Button>
        </div>
      </form>
    </Card>
  );
}
