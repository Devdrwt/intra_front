import { useState, type FormEvent } from 'react';
import { Building2, Plus, Trash2, X } from 'lucide-react';
import { Badge, Button, Callout, Card, EmptyState, Input, PageHeader, Select, SkeletonRows } from '@drwindesk/ui';
import { apiErrorMessage } from '@/lib/api';
import { useCreateTiers, useDeleteTiers, useTiers } from './hooks';
import { TIERS_TYPE_LABEL, TIERS_TYPE_OPTIONS, type TiersInput, type TiersType } from './types';

export function TiersPage() {
  const [type, setType] = useState<TiersType | ''>('');
  const { data: tiers, isLoading } = useTiers(type || undefined);
  const remove = useDeleteTiers();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tiers"
        subtitle="Clients & fournisseurs — référentiel partagé de la finance."
        actions={
          <Button onClick={() => setOpen((v) => !v)} variant={open ? 'secondary' : 'primary'}>
            {open ? <X size={18} /> : <Plus size={18} />} {open ? 'Fermer' : 'Nouveau tiers'}
          </Button>
        }
      />

      {open && <CreatePanel onDone={() => setOpen(false)} />}

      <Card className="flex items-end gap-3">
        <Select
          id="type"
          label="Type"
          value={type}
          onChange={(e) => setType(e.target.value as TiersType | '')}
          options={[{ value: '', label: 'Tous' }, ...TIERS_TYPE_OPTIONS]}
        />
      </Card>

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <SkeletonRows rows={4} cols={4} />
        ) : !tiers || tiers.length === 0 ? (
          <EmptyState icon={<Building2 size={20} />} title="Aucun tiers" description="Ajoutez vos clients et fournisseurs." />
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-surface-border bg-surface-muted text-left text-xs uppercase tracking-wide text-ink-subtle">
              <tr>
                <th className="px-5 py-2.5 font-medium">Tiers</th>
                <th className="hidden px-5 py-2.5 font-medium sm:table-cell">Type</th>
                <th className="hidden px-5 py-2.5 font-medium lg:table-cell">Compte</th>
                <th className="px-5 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((t, i) => (
                <tr key={t.id} className="border-b border-surface-border last:border-0 animate-row" style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}>
                  <td className="px-5 py-3">
                    <div className="font-medium text-ink">{t.nom}</div>
                    <div className="text-xs text-ink-subtle">{t.code}{t.ifu ? ` · IFU ${t.ifu}` : ''}</div>
                  </td>
                  <td className="hidden px-5 py-3 sm:table-cell">
                    <Badge tone={t.type === 'CLIENT' ? 'success' : t.type === 'FOURNISSEUR' ? 'brand' : 'neutral'}>
                      {TIERS_TYPE_LABEL[t.type]}
                    </Badge>
                  </td>
                  <td className="hidden px-5 py-3 text-ink-muted lg:table-cell">{t.compteCode ?? '—'}</td>
                  <td className="px-5 py-3 text-right">
                    <Button size="sm" variant="ghost" disabled={remove.isPending} onClick={() => remove.mutate(t.id)}>
                      <Trash2 size={15} />
                    </Button>
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
  const create = useCreateTiers();
  const [form, setForm] = useState<TiersInput>({ type: 'CLIENT', nom: '' });
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof TiersInput>(k: K, v: TiersInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.nom.trim()) return setError('Nom requis.');
    try {
      await create.mutateAsync(form);
      onDone();
    } catch (err) {
      setError(apiErrorMessage(err, 'Création impossible.'));
    }
  };

  return (
    <Card>
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select id="t" label="Type *" value={form.type} onChange={(e) => set('type', e.target.value as TiersType)} options={TIERS_TYPE_OPTIONS} />
          <Input id="nom" label="Nom *" value={form.nom} onChange={(e) => set('nom', e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input id="ifu" label="IFU" value={form.ifu ?? ''} onChange={(e) => set('ifu', e.target.value)} />
          <Input id="rccm" label="RCCM" value={form.rccm ?? ''} onChange={(e) => set('rccm', e.target.value)} />
          <Input id="tel" label="Téléphone / MoMo" value={form.telephone ?? ''} onChange={(e) => set('telephone', e.target.value)} />
        </div>
        {error && <Callout tone="danger">{error}</Callout>}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onDone}>Annuler</Button>
          <Button type="submit" loading={create.isPending}>Créer</Button>
        </div>
      </form>
    </Card>
  );
}
