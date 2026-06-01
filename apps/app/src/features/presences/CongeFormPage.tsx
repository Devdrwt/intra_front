import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button, Card, Input, Select, Spinner } from '@drwindesk/ui';
import { useEmployes } from '@/features/rh/hooks';
import { fullName } from '@/features/rh/helpers';
import { useCreateConge } from './hooks';
import { TYPE_CONGE_OPTIONS, nbJours, type DemandeCongeInput, type TypeConge } from './types';

export function CongeFormPage() {
  const navigate = useNavigate();
  const { data: employes, isLoading } = useEmployes({});
  const create = useCreateConge();

  const [form, setForm] = useState<DemandeCongeInput>({
    employeId: '',
    type: 'ANNUEL',
    dateDebut: '',
    dateFin: '',
    motif: '',
  });
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof DemandeCongeInput>(k: K, v: DemandeCongeInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const jours = nbJours(form.dateDebut, form.dateFin);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.employeId) return setError('Sélectionnez un collaborateur.');
    if (jours <= 0) return setError('La période est invalide (fin avant début).');
    try {
      await create.mutateAsync({ ...form, motif: form.motif || undefined });
      navigate('/presences');
    } catch {
      setError('Enregistrement impossible.');
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
      <h1 className="mb-6 mt-3 text-2xl font-bold text-ink">Nouvelle demande de congé</h1>

      <form onSubmit={onSubmit}>
        <Card>
          <div className="grid gap-4">
            <Select
              label="Collaborateur *"
              placeholder="Sélectionner…"
              options={(employes ?? []).map((e) => ({ value: e.id, label: fullName(e) }))}
              value={form.employeId}
              onChange={(e) => set('employeId', e.target.value)}
            />
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
                required
              />
              <Input
                type="date"
                label="Au *"
                value={form.dateFin}
                onChange={(e) => set('dateFin', e.target.value)}
                required
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
          </div>

          {error && <p className="mt-4 text-sm text-danger">{error}</p>}

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => navigate('/presences')}>
              Annuler
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? 'Envoi…' : 'Soumettre la demande'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
