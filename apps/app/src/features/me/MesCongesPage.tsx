import { useState, type FormEvent } from 'react';
import { CalendarClock, Plus, X } from 'lucide-react';
import { Badge, Button, Callout, Card, CardTitle, EmptyState, Input, Select, Skeleton } from '@drwindesk/ui';
import { apiErrorMessage } from '@/lib/api';
import {
  STATUT_CONGE_LABEL,
  TYPE_CONGE_LABEL,
  TYPE_CONGE_OPTIONS,
  nbJours,
  type StatutConge,
  type TypeConge,
} from '@/features/presences/types';
import { useCancelMyConge, useCreateMyConge, useMyConges } from './hooks';
import type { MeCongeInput } from './service';
import { MeNotLinked } from './MeNotLinked';

const STATUT_TONE: Record<StatutConge, 'success' | 'warning' | 'danger'> = {
  EN_ATTENTE: 'warning',
  APPROUVE: 'success',
  REFUSE: 'danger',
};
const fmt = (iso: string) => new Date(iso).toLocaleDateString('fr-FR');
type Errors = Partial<Record<keyof MeCongeInput, string>>;

const EMPTY: MeCongeInput = { type: 'ANNUEL', dateDebut: '', dateFin: '', motif: '' };

export function MesCongesPage() {
  const { data: conges, isLoading, error } = useMyConges();
  const create = useCreateMyConge();
  const cancel = useCancelMyConge();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<MeCongeInput>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);

  if (error) return <MeNotLinked />;

  const set = <K extends keyof MeCongeInput>(k: K, v: MeCongeInput[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((p) => (p[k] ? { ...p, [k]: undefined } : p));
  };

  const jours = nbJours(form.dateDebut, form.dateFin);

  const validate = (f: MeCongeInput): Errors => {
    const e: Errors = {};
    if (!f.dateDebut) e.dateDebut = 'Date de début requise.';
    if (!f.dateFin) e.dateFin = 'Date de fin requise.';
    else if (f.dateDebut && f.dateFin < f.dateDebut) e.dateFin = 'La fin doit suivre le début.';
    return e;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) {
      setFormError('Veuillez corriger les champs signalés.');
      return;
    }
    setFormError(null);
    try {
      await create.mutateAsync({ ...form, motif: form.motif || undefined });
      setForm(EMPTY);
      setOpen(false);
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Envoi impossible.'));
    }
  };

  const list = conges ?? [];

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-ink">Mes congés</h2>
          <p className="text-ink-muted">Déposez vos demandes et suivez leur statut.</p>
        </div>
        <Button onClick={() => setOpen((v) => !v)}>
          <Plus size={16} /> Demander un congé
        </Button>
      </header>

      {open && (
        <Card>
          <CardTitle>Nouvelle demande</CardTitle>
          <form onSubmit={onSubmit} noValidate className="mt-4 space-y-4">
            <Select
              label="Type *"
              options={TYPE_CONGE_OPTIONS}
              value={form.type}
              onChange={(e) => set('type', e.target.value as TypeConge)}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                type="date"
                label="Du *"
                value={form.dateDebut}
                onChange={(e) => set('dateDebut', e.target.value)}
                error={errors.dateDebut}
              />
              <Input
                type="date"
                label="Au *"
                value={form.dateFin}
                onChange={(e) => set('dateFin', e.target.value)}
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
              value={form.motif ?? ''}
              onChange={(e) => set('motif', e.target.value)}
              placeholder="Optionnel"
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
          <CardTitle>Mes demandes</CardTitle>
        </div>
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <EmptyState
            icon={<CalendarClock size={20} />}
            title="Aucune demande"
            description="Vos demandes de congé apparaîtront ici."
            className="py-10"
          />
        ) : (
          <ul className="mt-3 divide-y divide-surface-border">
            {list.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-4 px-5 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{TYPE_CONGE_LABEL[c.type]}</p>
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
