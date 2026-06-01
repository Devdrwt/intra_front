import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Send } from 'lucide-react';
import { Button, Card, Input, Select, Spinner, Textarea } from '@drwindesk/ui';
import { useEmployes } from '@/features/rh/hooks';
import { fullName } from '@/features/rh/helpers';
import { useUpsertRapport } from './hooks';
import type { StatutRapport } from './types';

const today = () => new Date().toISOString().slice(0, 10);

export function RapportFormPage() {
  const navigate = useNavigate();
  const { data: employes, isLoading } = useEmployes({});
  const upsert = useUpsertRapport();

  const [employeId, setEmployeId] = useState('');
  const [date, setDate] = useState(today());
  const [contenu, setContenu] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async (statut: StatutRapport) => {
    setError(null);
    if (!employeId) return setError('Sélectionnez un collaborateur.');
    if (!contenu.trim()) return setError('Le rapport ne peut pas être vide.');
    try {
      await upsert.mutateAsync({ employeId, date, contenu: contenu.trim(), statut });
      navigate('/rapports');
    } catch {
      setError('Enregistrement impossible.');
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void submit('SOUMIS');
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
        to="/rapports"
        className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"
      >
        <ArrowLeft size={16} /> Retour
      </Link>
      <h1 className="mb-6 mt-3 text-2xl font-bold text-ink">Saisir un rapport journalier</h1>

      <form onSubmit={onSubmit}>
        <Card>
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Collaborateur *"
                placeholder="Sélectionner…"
                options={(employes ?? []).map((e) => ({ value: e.id, label: fullName(e) }))}
                value={employeId}
                onChange={(e) => setEmployeId(e.target.value)}
              />
              <Input
                type="date"
                label="Jour *"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <Textarea
              label="Contenu du rapport *"
              rows={8}
              value={contenu}
              onChange={(e) => setContenu(e.target.value)}
              placeholder="Activités réalisées, points de blocage, prochaines étapes…"
            />
          </div>

          {error && <p className="mt-4 text-sm text-danger">{error}</p>}

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              disabled={upsert.isPending}
              onClick={() => void submit('BROUILLON')}
            >
              <Save size={16} /> Enregistrer le brouillon
            </Button>
            <Button type="submit" disabled={upsert.isPending}>
              <Send size={16} /> {upsert.isPending ? 'Envoi…' : 'Soumettre'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
