import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Mail, Pencil, Phone, Trash2, TriangleAlert } from 'lucide-react';
import { Badge, Button, Card, CardTitle, Spinner } from '@drwindesk/ui';
import { useDeleteEmploye, useEmploye } from './hooks';
import { EmployeDocuments } from '@/features/documents/EmployeDocuments';
import {
  fullName,
  initials,
  statutLabel,
  statutTone,
  formatDate,
  joursAvantEcheance,
} from './helpers';

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-ink-subtle">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink">{value}</dd>
    </div>
  );
}

export function EmployeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: employe, isLoading, isError } = useEmploye(id);
  const remove = useDeleteEmploye();

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }
  if (isError || !employe) {
    return <div className="py-16 text-center text-danger">Collaborateur introuvable.</div>;
  }

  const echeance = joursAvantEcheance(employe.dateFinContrat);
  const onDelete = async () => {
    if (!confirm(`Supprimer ${fullName(employe)} ? Cette action est irréversible.`)) return;
    await remove.mutateAsync(employe.id);
    navigate('/rh');
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/rh" className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline">
        <ArrowLeft size={16} /> Retour à la liste
      </Link>

      <header className="mb-6 mt-3 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-lg font-semibold text-brand-700">
            {initials(employe)}
          </span>
          <div>
            <h1 className="text-2xl font-bold text-ink">{fullName(employe)}</h1>
            <p className="text-ink-muted">
              {employe.poste} · {employe.matricule}
            </p>
          </div>
        </div>
        <Badge tone={statutTone(employe.statut)}>{statutLabel(employe.statut)}</Badge>
      </header>

      {echeance !== null && echeance <= 30 && (
        <div
          className={`mb-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
            echeance < 0
              ? 'border-red-200 bg-red-50 text-danger'
              : 'border-amber-200 bg-amber-50 text-warning'
          }`}
        >
          <TriangleAlert size={18} />
          {echeance < 0
            ? `Contrat échu depuis ${Math.abs(echeance)} jour(s) (${formatDate(employe.dateFinContrat)}).`
            : `Fin de contrat dans ${echeance} jour(s) — ${formatDate(employe.dateFinContrat)}.`}
        </div>
      )}

      <Card>
        <CardTitle>Informations</CardTitle>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Email" value={employe.email} />
          <Field label="Téléphone" value={employe.telephone ?? '—'} />
          <Field label="Département" value={employe.departement} />
          <Field label="Service" value={employe.service ?? '—'} />
          <Field label="Type de contrat" value={employe.typeContrat} />
          <Field label="Date d'embauche" value={formatDate(employe.dateEmbauche)} />
          <Field label="Fin de contrat" value={formatDate(employe.dateFinContrat)} />
        </dl>

        <div className="mt-5 flex gap-2 border-t border-surface-border pt-5">
          <a href={`mailto:${employe.email}`}>
            <Button variant="secondary" size="sm">
              <Mail size={16} /> Email
            </Button>
          </a>
          {employe.telephone && (
            <a href={`tel:${employe.telephone}`}>
              <Button variant="secondary" size="sm">
                <Phone size={16} /> Appeler
              </Button>
            </a>
          )}
        </div>
      </Card>

      <Card className="mt-4">
        <CardTitle>Documents & contrats</CardTitle>
        <div className="mt-3">
          <EmployeDocuments employeId={employe.id} />
        </div>
      </Card>

      <div className="mt-6 flex justify-between">
        <Button variant="danger" onClick={onDelete} disabled={remove.isPending}>
          <Trash2 size={16} /> Supprimer
        </Button>
        <Link to={`/rh/${employe.id}/editer`}>
          <Button>
            <Pencil size={16} /> Modifier
          </Button>
        </Link>
      </div>
    </div>
  );
}
