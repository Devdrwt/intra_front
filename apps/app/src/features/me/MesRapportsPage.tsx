import { useState, type FormEvent } from 'react';
import { FileBarChart, Save, Send } from 'lucide-react';
import { Badge, Button, Callout, Card, CardTitle, EmptyState, Input, Skeleton, Textarea } from '@drwindesk/ui';
import { apiErrorMessage } from '@/lib/api';
import { STATUT_RAPPORT_LABEL, type StatutRapport } from '@/features/rapports/types';
import { useMyRapports, useUpsertMyRapport } from './hooks';
import { MeNotLinked } from './MeNotLinked';

const today = () => new Date().toISOString().slice(0, 10);
const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });

export function MesRapportsPage() {
  const { data: rapports, isLoading, error } = useMyRapports();
  const upsert = useUpsertMyRapport();

  const [date, setDate] = useState(today());
  const [contenu, setContenu] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  if (error) return <MeNotLinked />;

  const submit = async (statut: StatutRapport) => {
    if (!contenu.trim()) {
      setFieldError('Le rapport ne peut pas être vide.');
      setFormError('Veuillez corriger les champs signalés.');
      return;
    }
    setFieldError(null);
    setFormError(null);
    try {
      await upsert.mutateAsync({ date, contenu: contenu.trim(), statut });
      if (statut === 'SOUMIS') setContenu('');
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Enregistrement impossible.'));
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void submit('SOUMIS');
  };

  const list = rapports ?? [];

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-ink">Mes rapports</h2>
        <p className="text-ink-muted">Rédigez et envoyez votre rapport journalier.</p>
      </header>

      <Card>
        <CardTitle>Rapport du jour</CardTitle>
        <form onSubmit={onSubmit} noValidate className="mt-4 space-y-4">
          <Input
            type="date"
            label="Jour"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="sm:max-w-xs"
          />
          <Textarea
            label="Contenu *"
            rows={7}
            value={contenu}
            onChange={(e) => {
              setContenu(e.target.value);
              setFieldError(null);
            }}
            placeholder="Activités réalisées, points de blocage, prochaines étapes…"
            error={fieldError ?? undefined}
          />
          {formError && <Callout tone="danger">{formError}</Callout>}
          <div className="flex flex-wrap justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              disabled={upsert.isPending}
              onClick={() => void submit('BROUILLON')}
            >
              <Save size={16} /> Brouillon
            </Button>
            <Button type="submit" loading={upsert.isPending}>
              <Send size={16} /> Soumettre
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-0">
        <div className="p-5 pb-0">
          <CardTitle>Historique</CardTitle>
        </div>
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <EmptyState
            icon={<FileBarChart size={20} />}
            title="Aucun rapport"
            description="Vos rapports apparaîtront ici."
            className="py-10"
          />
        ) : (
          <ul className="mt-3 divide-y divide-surface-border">
            {list.map((r) => (
              <li key={r.id} className="px-5 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize text-ink">{fmt(r.date)}</span>
                  <Badge tone={r.statut === 'SOUMIS' ? 'success' : 'warning'} dot>
                    {STATUT_RAPPORT_LABEL[r.statut]}
                  </Badge>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{r.contenu}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
