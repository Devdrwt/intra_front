import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button, Callout, Card, Input, Select, Spinner, Textarea } from '@drwindesk/ui';
import { apiErrorMessage } from '@/lib/api';
import { useAssignablePeople, useCreateProject, useProject, useUpdateProject } from './hooks';
import type { ProjectPerson } from './types';

const personName = (p: ProjectPerson) => `${p.prenom} ${p.nom}`.trim() || '—';
import {
  STATUT_PROJET_OPTIONS,
  type ProjectInput,
  type StatutProjet,
} from './types';

type Errors = { nom?: string; dateFin?: string };

export function ProjectFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const { data: employes } = useAssignablePeople();
  const { data: existing, isLoading } = useProject(id);
  const create = useCreateProject();
  const update = useUpdateProject(id ?? '');

  const [form, setForm] = useState<ProjectInput>({
    nom: '',
    description: '',
    statut: 'EN_COURS',
    client: '',
    progression: 0,
    dateDebut: '',
    dateFin: '',
    livrableUrl: '',
    responsableId: '',
    membreIds: [],
  });
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existing) {
      setForm({
        nom: existing.nom,
        description: existing.description ?? '',
        statut: existing.statut,
        client: existing.client ?? '',
        progression: existing.progression,
        dateDebut: existing.dateDebut ?? '',
        dateFin: existing.dateFin ?? '',
        livrableUrl: existing.livrableUrl ?? '',
        responsableId: existing.responsable?.id ?? '',
        membreIds: existing.membres.map((m) => m.id),
      });
    }
  }, [existing]);

  const set = <K extends keyof ProjectInput>(k: K, v: ProjectInput[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((p) => ({ ...p, [k]: undefined }));
  };

  const toggleMembre = (employeId: string) => {
    setForm((f) => {
      const cur = f.membreIds ?? [];
      return { ...f, membreIds: cur.includes(employeId) ? cur.filter((x) => x !== employeId) : [...cur, employeId] };
    });
  };

  const empOptions = useMemo(
    () => [
      { value: '', label: 'Aucun' },
      ...(employes ?? []).map((e) => ({ value: e.id, label: personName(e) })),
    ],
    [employes],
  );

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Errors = {};
    if (!form.nom.trim()) errs.nom = 'Le nom du projet est requis.';
    if (form.dateDebut && form.dateFin && form.dateFin < form.dateDebut)
      errs.dateFin = 'La fin doit suivre le début.';
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) {
      setError('Veuillez corriger les champs signalés.');
      return;
    }
    setError(null);

    const payload: ProjectInput = {
      nom: form.nom.trim(),
      description: form.description || undefined,
      statut: form.statut,
      client: form.client || undefined,
      progression: Number(form.progression) || 0,
      dateDebut: form.dateDebut || undefined,
      dateFin: form.dateFin || undefined,
      livrableUrl: form.livrableUrl || undefined,
      responsableId: form.responsableId || undefined,
      membreIds: form.membreIds,
    };
    try {
      const saved = isEdit ? await update.mutateAsync(payload) : await create.mutateAsync(payload);
      navigate(`/projets/${saved.id}`);
    } catch (err) {
      setError(apiErrorMessage(err, 'Enregistrement impossible.'));
    }
  };

  if (isEdit && isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  const saving = create.isPending || update.isPending;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to={isEdit ? `/projets/${id}` : '/projets'}
        className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"
      >
        <ArrowLeft size={16} /> Retour
      </Link>
      <h1 className="mb-6 mt-3 text-2xl font-bold tracking-tight text-ink">
        {isEdit ? 'Modifier le projet' : 'Nouveau projet'}
      </h1>

      <form onSubmit={onSubmit} noValidate>
        <Card className="space-y-4">
          <Input
            label="Nom du projet *"
            value={form.nom}
            onChange={(e) => set('nom', e.target.value)}
            error={errors.nom}
          />
          <Textarea
            label="Description"
            rows={4}
            value={form.description ?? ''}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Objectif, périmètre, parties prenantes…"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Statut"
              options={STATUT_PROJET_OPTIONS}
              value={form.statut}
              onChange={(e) => set('statut', e.target.value as StatutProjet)}
            />
            <Input label="Client" value={form.client ?? ''} onChange={(e) => set('client', e.target.value)} />
            <Input
              type="date"
              label="Début"
              value={form.dateDebut ?? ''}
              onChange={(e) => set('dateDebut', e.target.value)}
            />
            <Input
              type="date"
              label="Échéance (fin)"
              value={form.dateFin ?? ''}
              onChange={(e) => set('dateFin', e.target.value)}
              error={errors.dateFin}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">
              Avancement : <span className="tabular-nums">{form.progression}%</span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={form.progression}
              onChange={(e) => set('progression', Number(e.target.value))}
              className="w-full accent-brand-600"
            />
          </div>

          <Select
            label="Responsable"
            options={empOptions}
            value={form.responsableId ?? ''}
            onChange={(e) => set('responsableId', e.target.value)}
          />

          {/* Équipe (multi) */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Équipe</label>
            <div className="max-h-48 overflow-y-auto rounded-xl border border-surface-border p-2">
              {(employes ?? []).length === 0 ? (
                <p className="px-2 py-1 text-sm text-ink-subtle">Aucun collaborateur disponible.</p>
              ) : (
                (employes ?? []).map((e) => (
                  <label
                    key={e.id}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-surface-muted"
                  >
                    <input
                      type="checkbox"
                      className="accent-brand-600"
                      checked={(form.membreIds ?? []).includes(e.id)}
                      onChange={() => toggleMembre(e.id)}
                    />
                    <span className="text-ink">{personName(e)}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {form.statut === 'LIVRE' && (
            <Input
              label="Lien du livrable"
              value={form.livrableUrl ?? ''}
              onChange={(e) => set('livrableUrl', e.target.value)}
              placeholder="https://…"
            />
          )}

          {error && <Callout tone="danger">{error}</Callout>}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(isEdit ? `/projets/${id}` : '/projets')}
            >
              Annuler
            </Button>
            <Button type="submit" loading={saving}>
              {isEdit ? 'Enregistrer' : 'Créer le projet'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
