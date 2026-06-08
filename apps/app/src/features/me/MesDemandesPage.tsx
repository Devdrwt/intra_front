import { useMemo, useState, type FormEvent } from 'react';
import { Clock, Coffee, Plane, Plus, X, type LucideIcon } from 'lucide-react';
import { Badge, Button, Callout, Card, CardTitle, EmptyState, Input, Select, Skeleton, cn } from '@drwindesk/ui';
import { apiErrorMessage } from '@/lib/api';
import {
  CATEGORIE_LABEL,
  STATUT_CONGE_LABEL,
  TYPE_CONGE_LABEL,
  TYPE_CONGE_OPTIONS,
  nbJours,
  type CategorieDemande,
  type StatutConge,
  type TypeConge,
} from '@/features/presences/types';
import { useCancelMyConge, useCreateMyConge, useMyConges } from './hooks';
import { MeNotLinked } from './MeNotLinked';

const STATUT_TONE: Record<StatutConge, 'success' | 'warning' | 'danger'> = {
  EN_ATTENTE: 'warning',
  APPROUVE: 'success',
  REFUSE: 'danger',
};

const TABS: { key: CategorieDemande; label: string; icon: LucideIcon; hint: string }[] = [
  { key: 'PERMISSION', label: 'Permissions', icon: Clock, hint: 'Absence courte autorisée (rendez-vous, démarche…).' },
  { key: 'REPOS', label: 'Repos', icon: Coffee, hint: 'Journée(s) de repos / récupération.' },
  { key: 'CONGE', label: 'Congés', icon: Plane, hint: 'Congé annuel, maladie, sans solde ou exceptionnel.' },
];

const fmt = (iso: string) => new Date(iso).toLocaleDateString('fr-FR');

interface FormState {
  type: TypeConge;
  dateDebut: string;
  dateFin: string;
  motif: string;
}
const EMPTY: FormState = { type: 'ANNUEL', dateDebut: '', dateFin: '', motif: '' };

export function MesDemandesPage() {
  const { data: conges, isLoading, error } = useMyConges();
  const create = useCreateMyConge();
  const cancel = useCancelMyConge();

  const [tab, setTab] = useState<CategorieDemande>('PERMISSION');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<{ dateDebut?: string; dateFin?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);

  const all = useMemo(() => conges ?? [], [conges]);
  // Compat : les anciennes demandes sans catégorie comptent comme « Congé ».
  const list = all.filter((c) => (c.categorie ?? 'CONGE') === tab);
  const countByTab = (k: CategorieDemande) =>
    all.filter((c) => (c.categorie ?? 'CONGE') === k && c.statut === 'EN_ATTENTE').length;

  if (error) return <MeNotLinked />;

  const switchTab = (k: CategorieDemande) => {
    setTab(k);
    setOpen(false);
    setForm(EMPTY);
    setErrors({});
    setFormError(null);
  };

  const jours = nbJours(form.dateDebut, form.dateFin);
  const meta = TABS.find((t) => t.key === tab)!;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!form.dateDebut) errs.dateDebut = 'Date de début requise.';
    if (!form.dateFin) errs.dateFin = 'Date de fin requise.';
    else if (form.dateDebut && form.dateFin < form.dateDebut) errs.dateFin = 'La fin doit suivre le début.';
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) return setFormError('Veuillez corriger les champs signalés.');
    setFormError(null);
    try {
      await create.mutateAsync({
        categorie: tab,
        type: tab === 'CONGE' ? form.type : undefined,
        dateDebut: form.dateDebut,
        dateFin: form.dateFin,
        motif: form.motif || undefined,
      });
      setForm(EMPTY);
      setOpen(false);
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Envoi impossible.'));
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-ink">Mes demandes</h2>
        <p className="text-ink-muted">Permissions, repos et congés — déposez et suivez vos demandes.</p>
      </header>

      {/* Onglets */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = tab === t.key;
          const pending = countByTab(t.key);
          return (
            <button
              key={t.key}
              onClick={() => switchTab(t.key)}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors',
                active
                  ? 'border-brand-500 bg-brand-soft text-brand-soft-fg'
                  : 'border-surface-border text-ink-muted hover:bg-surface-muted hover:text-ink',
              )}
            >
              <t.icon size={16} />
              {t.label}
              {pending > 0 && (
                <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-warning px-1.5 text-[11px] font-semibold text-white">
                  {pending}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-ink-muted">{meta.hint}</p>
        <Button onClick={() => setOpen((v) => !v)}>
          <Plus size={16} /> Nouvelle demande
        </Button>
      </div>

      {open && (
        <Card>
          <CardTitle>Demande de {CATEGORIE_LABEL[tab].toLowerCase()}</CardTitle>
          <form onSubmit={onSubmit} noValidate className="mt-4 space-y-4">
            {tab === 'CONGE' && (
              <Select
                label="Type de congé *"
                options={TYPE_CONGE_OPTIONS}
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as TypeConge }))}
              />
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                type="date"
                label="Du *"
                value={form.dateDebut}
                onChange={(e) => setForm((f) => ({ ...f, dateDebut: e.target.value }))}
                error={errors.dateDebut}
              />
              <Input
                type="date"
                label="Au *"
                value={form.dateFin}
                onChange={(e) => setForm((f) => ({ ...f, dateFin: e.target.value }))}
                error={errors.dateFin}
              />
            </div>
            {jours > 0 && (
              <p className="text-sm text-ink-muted">
                Durée : <span className="font-medium text-ink">{jours} jour(s)</span>
              </p>
            )}
            <Input
              label="Motif"
              value={form.motif}
              onChange={(e) => setForm((f) => ({ ...f, motif: e.target.value }))}
              placeholder={tab === 'CONGE' ? 'Optionnel' : 'Précisez le motif'}
            />
            {formError && <Callout tone="danger">{formError}</Callout>}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" loading={create.isPending}>
                Soumettre la demande
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="p-0">
        <div className="p-5 pb-0">
          <CardTitle>Historique — {meta.label}</CardTitle>
        </div>
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <EmptyState
            icon={<meta.icon size={20} />}
            title={`Aucune demande de ${CATEGORIE_LABEL[tab].toLowerCase()}`}
            description="Vos demandes de cette catégorie apparaîtront ici."
            className="py-10"
          />
        ) : (
          <ul className="mt-3 divide-y divide-surface-border">
            {list.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-4 px-5 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">
                    {tab === 'CONGE' ? TYPE_CONGE_LABEL[c.type] : CATEGORIE_LABEL[c.categorie ?? 'CONGE']}
                  </p>
                  <p className="text-xs text-ink-subtle">
                    Du {fmt(c.dateDebut)} au {fmt(c.dateFin)} · {nbJours(c.dateDebut, c.dateFin)} j
                    {c.motif ? ` · ${c.motif}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge tone={STATUT_TONE[c.statut]} dot>
                    {STATUT_CONGE_LABEL[c.statut]}
                  </Badge>
                  {c.statut === 'EN_ATTENTE' && (
                    <button
                      type="button"
                      onClick={() => cancel.mutate(c.id)}
                      disabled={cancel.isPending}
                      title="Annuler la demande"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-subtle transition-colors hover:bg-surface-muted hover:text-danger"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
