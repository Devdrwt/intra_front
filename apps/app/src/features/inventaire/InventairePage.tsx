import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Boxes, Package, Plus, Trash2, X } from 'lucide-react';
import { Badge, Button, Callout, Card, EmptyState, Input, PageHeader, Select, SkeletonRows } from '@drwindesk/ui';
import type { BadgeProps } from '@drwindesk/ui';
import { apiErrorMessage } from '@/lib/api';
import { fcfa, fcfaCompact } from '@/lib/money';
import { inventaireService, type BienInput, type EtatBien, type TypeBien } from './service';

const ETAT_LABEL: Record<EtatBien, string> = {
  NEUF: 'Neuf', BON: 'Bon', USAGE: 'Usagé', HORS_SERVICE: 'Hors service', REFORME: 'Réformé',
};
const ETAT_TONE: Record<EtatBien, NonNullable<BadgeProps['tone']>> = {
  NEUF: 'success', BON: 'brand', USAGE: 'warning', HORS_SERVICE: 'danger', REFORME: 'neutral',
};
const ETAT_OPTIONS = (Object.keys(ETAT_LABEL) as EtatBien[]).map((value) => ({ value, label: ETAT_LABEL[value] }));

export function InventairePage() {
  const [search, setSearch] = useState('');
  const [categorie, setCategorie] = useState('');
  const [etat, setEtat] = useState('');
  const [open, setOpen] = useState(false);

  const { data: categories } = useQuery({ queryKey: ['inventaire', 'categories'], queryFn: inventaireService.categories });
  const { data: stats } = useQuery({ queryKey: ['inventaire', 'stats'], queryFn: inventaireService.stats });
  const filters = useMemo(() => ({ search, categorie, etat }), [search, categorie, etat]);
  const { data: biens, isLoading } = useQuery({
    queryKey: ['inventaire', 'biens', filters],
    queryFn: () => inventaireService.list(search, categorie, etat),
  });
  const qc = useQueryClient();
  const remove = useMutation({
    mutationFn: (id: string) => inventaireService.remove(id),
    meta: { successMessage: 'Bien retiré' },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventaire'] }),
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Inventaire & immobilisations"
        subtitle="Patrimoine de l'entreprise — matériel, mobilier, véhicules, équipement."
        actions={
          <Button onClick={() => setOpen((v) => !v)} variant={open ? 'secondary' : 'primary'}>
            {open ? <X size={18} /> : <Plus size={18} />} {open ? 'Fermer' : 'Nouveau bien'}
          </Button>
        }
      />

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <div className="flex items-center gap-2 text-ink-muted"><Boxes size={18} /><span className="text-xs">Valeur du patrimoine</span></div>
            <div className="mt-2 text-xl font-bold text-ink">{fcfaCompact(stats.total)}</div>
            <div className="text-xs text-ink-subtle">{stats.nbBiens} bien(s)</div>
          </Card>
          {Object.entries(stats.byCategorie).slice(0, 3).map(([cat, val]) => (
            <Card key={cat}>
              <div className="text-xs text-ink-muted">{cat}</div>
              <div className="mt-2 text-lg font-bold text-ink">{fcfaCompact(val)}</div>
            </Card>
          ))}
        </div>
      )}

      {open && <CreatePanel categories={categories ?? []} onDone={() => setOpen(false)} />}

      <Card className="flex flex-wrap items-end gap-3">
        <Input id="q" label="Recherche" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Réf, nom, affecté à…" className="min-w-[180px] flex-1" />
        <Select id="cat" label="Catégorie" value={categorie} onChange={(e) => setCategorie(e.target.value)}
          options={[{ value: '', label: 'Toutes' }, ...(categories ?? []).map((c) => ({ value: c, label: c }))]} />
        <Select id="etat" label="État" value={etat} onChange={(e) => setEtat(e.target.value)}
          options={[{ value: '', label: 'Tous' }, ...ETAT_OPTIONS]} />
      </Card>

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <SkeletonRows rows={5} cols={4} />
        ) : !biens || biens.length === 0 ? (
          <EmptyState icon={<Package size={20} />} title="Aucun bien" description="Aucun bien ne correspond à ces filtres." />
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-surface-border bg-surface-muted text-left text-xs uppercase tracking-wide text-ink-subtle">
              <tr>
                <th className="px-5 py-2.5 font-medium">Bien</th>
                <th className="hidden px-5 py-2.5 font-medium sm:table-cell">Affectation</th>
                <th className="px-5 py-2.5 font-medium">Valeur</th>
                <th className="px-5 py-2.5 font-medium">État</th>
                <th className="px-5 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {biens.map((b, i) => (
                <tr key={b.id} className="border-b border-surface-border last:border-0 animate-row" style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}>
                  <td className="px-5 py-3">
                    <div className="font-medium text-ink">{b.nom}{b.quantite > 1 ? ` ×${b.quantite}` : ''}</div>
                    <div className="text-xs text-ink-subtle">{b.reference}{b.categorie ? ` · ${b.categorie}` : ''}{b.localisation ? ` · ${b.localisation}` : ''}</div>
                  </td>
                  <td className="hidden px-5 py-3 text-ink-muted sm:table-cell">{b.affecteA ?? '—'}</td>
                  <td className="px-5 py-3 text-ink">{b.valeurAcquisition ? fcfa(b.valeurAcquisition * b.quantite) : '—'}</td>
                  <td className="px-5 py-3"><Badge tone={ETAT_TONE[b.etat]} dot>{ETAT_LABEL[b.etat]}</Badge></td>
                  <td className="px-5 py-3 text-right">
                    <Button size="sm" variant="ghost" disabled={remove.isPending} onClick={() => remove.mutate(b.id)}><Trash2 size={15} /></Button>
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

function CreatePanel({ categories, onDone }: { categories: string[]; onDone: () => void }) {
  const qc = useQueryClient();
  const create = useMutation({
    mutationFn: (input: BienInput) => inventaireService.create(input),
    meta: { successMessage: 'Bien ajouté' },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inventaire'] }); onDone(); },
  });
  const [form, setForm] = useState<BienInput>({ nom: '', type: 'IMMOBILISATION', etat: 'BON', quantite: 1 });
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof BienInput>(k: K, v: BienInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.nom.trim()) return setError('Nom requis.');
    try {
      await create.mutateAsync(form);
    } catch (err) {
      setError(apiErrorMessage(err, 'Création impossible.'));
    }
  };

  return (
    <Card>
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input id="nom" label="Nom *" value={form.nom} onChange={(e) => set('nom', e.target.value)} />
          <Select id="cat" label="Catégorie" value={form.categorie ?? ''} onChange={(e) => set('categorie', e.target.value)}
            options={[{ value: '', label: '—' }, ...categories.map((c) => ({ value: c, label: c }))]} />
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          <Select id="type" label="Type" value={form.type} onChange={(e) => set('type', e.target.value as TypeBien)}
            options={[{ value: 'IMMOBILISATION', label: 'Immobilisation' }, { value: 'CONSOMMABLE', label: 'Consommable' }]} />
          <Select id="etat" label="État" value={form.etat} onChange={(e) => set('etat', e.target.value as EtatBien)} options={ETAT_OPTIONS} />
          <Input id="qte" type="number" label="Quantité" value={String(form.quantite)} onChange={(e) => set('quantite', Number(e.target.value) || 1)} />
          <Input id="val" type="number" label="Valeur (F)" value={form.valeurAcquisition ? String(form.valeurAcquisition) : ''} onChange={(e) => set('valeurAcquisition', e.target.value ? Number(e.target.value) : undefined)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input id="loc" label="Localisation" value={form.localisation ?? ''} onChange={(e) => set('localisation', e.target.value)} />
          <Input id="aff" label="Affecté à" value={form.affecteA ?? ''} onChange={(e) => set('affecteA', e.target.value)} />
        </div>
        {error && <Callout tone="danger">{error}</Callout>}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onDone}>Annuler</Button>
          <Button type="submit" loading={create.isPending}>Ajouter au patrimoine</Button>
        </div>
      </form>
    </Card>
  );
}
