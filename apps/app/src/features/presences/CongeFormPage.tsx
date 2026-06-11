import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button, Callout, Card, Input, Select, Spinner } from '@drwindesk/ui';
import { apiErrorMessage } from '@/lib/api';
import { useEmployes } from '@/features/rh/hooks';
import { fullName } from '@/features/rh/helpers';
import { useCreateConge } from './hooks';
import {
  CATEGORIE_LABEL,
  TYPE_CONGE_OPTIONS,
  nbJours,
  type CategorieDemande,
  type DemandeCongeInput,
  type TypeConge,
} from './types';

const CATEGORIE_OPTIONS = (['PERMISSION', 'REPOS', 'CONGE'] as CategorieDemande[]).map((c) => ({
  value: c,
  label: CATEGORIE_LABEL[c],
}));

type Errors = Partial<Record<keyof DemandeCongeInput, string>>;

export function CongeFormPage() {
  const navigate = useNavigate();
  const { data: employes, isLoading } = useEmployes({});
  const create = useCreateConge();

  const [form, setForm] = useState<DemandeCongeInput>({
    employeId: '',
    categorie: 'CONGE',
    type: 'ANNUEL',
    dateDebut: '',
    dateFin: '',
    motif: '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof DemandeCongeInput>(k: K, v: DemandeCongeInput[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((prev) => (prev[k] ? { ...prev, [k]: undefined } : prev));
  };

  const jours = nbJours(form.dateDebut, form.dateFin);

  const validate = (f: DemandeCongeInput): Errors => {
    const e: Errors = {};
    if (!f.employeId) e.employeId = 'Sélectionnez un collaborateur.';
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
      setError('Veuillez corriger les champs signalés.');
      return;
    }
    setError(null);
    try {
      await create.mutateAsync({ ...form, motif: form.motif || undefined });
      navigate('/presences');
    } catch (err) {
      setError(apiErrorMessage(err, 'Enregistrement impossible.'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        to="/presences"
        className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"
      >
        <ArrowLeft size={16} /> Retour
      </Link>
      <h1 className="mb-6 mt-3 text-2xl font-bold tracking-tight text-ink">Nouvelle demande</h1>

      <form onSubmit={onSubmit} noValidate>
        <Card className="space-y-4">
          <Select
            label="Collaborateur *"
            placeholder="Sélectionner…"
            options={(employes ?? []).map((e) => ({ value: e.id, label: fullName(e) }))}
            value={form.employeId}
            onChange={(e) => set('employeId', e.target.value)}
            error={errors.employeId}
          />
          <Select
            label="Catégorie *"
            options={CATEGORIE_OPTIONS}
            value={form.categorie}
            onChange={(e) => set('categorie', e.target.value as CategorieDemande)}
          />
          {form.categorie === 'CONGE' && (
            <Select
              label="Type de congé *"
              options={TYPE_CONGE_OPTIONS}
              value={form.type}
              onChange={(e) => set('type', e.target.value as TypeConge)}
            />
          )}
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

          {error && <Callout tone="danger">{error}</Callout>}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => navigate('/presences')}>
              Annuler
            </Button>
            <Button type="submit" loading={create.isPending}>
              Soumettre la demande
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
