import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button, Card, Input, Select, Spinner } from '@drwindesk/ui';
import { apiErrorMessage } from '@/lib/api';
import { useDepartmentNames } from '@/features/settings/hooks';
import { STATUT_OPTIONS, TYPE_CONTRAT_OPTIONS, type EmployeInput } from './types';
import { useCreateEmploye, useEmploye, useUpdateEmploye } from './hooks';

const EMPTY: EmployeInput = {
  matricule: '',
  nom: '',
  prenom: '',
  email: '',
  telephone: '',
  poste: '',
  departement: '',
  service: '',
  typeContrat: 'CDI',
  statut: 'ACTIF',
  dateEmbauche: '',
  dateFinContrat: '',
};

export function EmployeFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const { data: existing, isLoading } = useEmploye(id);
  const create = useCreateEmploye();
  const update = useUpdateEmploye(id ?? '');
  const [form, setForm] = useState<EmployeInput>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const departments = useDepartmentNames();
  const deptOptions = Array.from(new Set([...departments, form.departement].filter(Boolean))).map(
    (d) => ({ value: d, label: d }),
  );

  useEffect(() => {
    if (existing) {
      const { id: _drop, ...rest } = existing;
      setForm({ ...EMPTY, ...rest });
    }
  }, [existing]);

  // Pré-sélectionne le 1er département pour une nouvelle fiche.
  useEffect(() => {
    if (!isEdit && departments.length) {
      setForm((f) => (f.departement ? f : { ...f, departement: departments[0]! }));
    }
  }, [isEdit, departments]);

  const set = <K extends keyof EmployeInput>(key: K, value: EmployeInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const payload: EmployeInput = {
      ...form,
      // Matricule retiré de l'UI : auto-généré à la création (le backend l'exige,
      // unique par tenant). Conservé tel quel en édition.
      matricule: form.matricule || `MAT-${Date.now().toString(36).toUpperCase()}`,
      telephone: form.telephone || undefined,
      service: form.service || undefined,
      dateFinContrat: form.dateFinContrat || undefined,
    };
    try {
      const saved = isEdit
        ? await update.mutateAsync(payload)
        : await create.mutateAsync(payload);
      navigate(`/rh/${saved.id}`);
    } catch (err) {
      setError(apiErrorMessage(err, 'Enregistrement impossible. Vérifiez les champs et réessayez.'));
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
        to={isEdit ? `/rh/${id}` : '/rh'}
        className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"
      >
        <ArrowLeft size={16} /> Retour
      </Link>
      <h1 className="mb-6 mt-3 text-2xl font-bold text-ink">
        {isEdit ? 'Modifier le collaborateur' : 'Nouveau collaborateur'}
      </h1>

      <form onSubmit={onSubmit}>
        <Card>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="prenom"
              label="Prénom *"
              value={form.prenom}
              onChange={(e) => set('prenom', e.target.value)}
              required
            />
            <Input
              id="nom"
              label="Nom *"
              value={form.nom}
              onChange={(e) => set('nom', e.target.value)}
              required
            />
            <Input
              id="email"
              type="email"
              label="Email *"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              required
            />
            <Input
              id="telephone"
              label="Téléphone"
              value={form.telephone ?? ''}
              onChange={(e) => set('telephone', e.target.value)}
            />
            <Input
              id="poste"
              label="Poste *"
              value={form.poste}
              onChange={(e) => set('poste', e.target.value)}
              required
            />
            <Select
              id="departement"
              label="Département *"
              options={deptOptions}
              value={form.departement}
              onChange={(e) => set('departement', e.target.value)}
            />
            <Input
              id="service"
              label="Service"
              value={form.service ?? ''}
              onChange={(e) => set('service', e.target.value)}
            />
            <Select
              id="typeContrat"
              label="Type de contrat *"
              options={TYPE_CONTRAT_OPTIONS}
              value={form.typeContrat}
              onChange={(e) => set('typeContrat', e.target.value as EmployeInput['typeContrat'])}
            />
            <Input
              id="dateEmbauche"
              type="date"
              label="Date d'embauche *"
              value={form.dateEmbauche}
              onChange={(e) => set('dateEmbauche', e.target.value)}
              required
            />
            <Input
              id="dateFinContrat"
              type="date"
              label="Fin de contrat (échéance)"
              value={form.dateFinContrat ?? ''}
              onChange={(e) => set('dateFinContrat', e.target.value)}
            />
            <Select
              id="statut"
              label="Statut *"
              options={STATUT_OPTIONS}
              value={form.statut}
              onChange={(e) => set('statut', e.target.value as EmployeInput['statut'])}
            />
          </div>

          {error && <p className="mt-4 text-sm text-danger">{error}</p>}

          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(isEdit ? `/rh/${id}` : '/rh')}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
