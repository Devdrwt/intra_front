import { LogIn, LogOut, Clock } from 'lucide-react';
import { Badge, Button, Card, CardTitle, EmptyState, Skeleton } from '@drwindesk/ui';
import { useMePointer, useMyPointages } from './hooks';
import { MeNotLinked } from './MeNotLinked';

const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });

export function MonPointagePage() {
  const { data: pointages, isLoading, error } = useMyPointages();
  const pointer = useMePointer();

  if (error) return <MeNotLinked />;

  const list = pointages ?? [];
  const todayP = list.find((p) => p.date === today());
  const hasEntree = Boolean(todayP?.heureEntree);
  const hasSortie = Boolean(todayP?.heureSortie);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-ink">Mon pointage</h2>
        <p className="text-ink-muted">Pointez vos arrivées et départs, suivez votre historique.</p>
      </header>

      {/* Aujourd'hui */}
      <Card>
        <CardTitle>Aujourd’hui</CardTitle>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">Entrée</p>
              <p className="text-2xl font-bold text-ink">{todayP?.heureEntree ?? '—'}</p>
            </div>
            <div className="h-10 w-px bg-surface-border" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">Sortie</p>
              <p className="text-2xl font-bold text-ink">{todayP?.heureSortie ?? '—'}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              disabled={hasEntree}
              loading={pointer.isPending && pointer.variables === 'ENTREE'}
              onClick={() => pointer.mutate('ENTREE')}
            >
              <LogIn size={16} /> Pointer l’entrée
            </Button>
            <Button
              disabled={!hasEntree || hasSortie}
              loading={pointer.isPending && pointer.variables === 'SORTIE'}
              onClick={() => pointer.mutate('SORTIE')}
            >
              <LogOut size={16} /> Pointer la sortie
            </Button>
          </div>
        </div>
      </Card>

      {/* Historique */}
      <Card className="p-0">
        <div className="p-5 pb-0">
          <CardTitle>Historique récent</CardTitle>
        </div>
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <EmptyState
            icon={<Clock size={20} />}
            title="Aucun pointage"
            description="Vos pointages apparaîtront ici."
            className="py-10"
          />
        ) : (
          <ul className="mt-3 divide-y divide-surface-border">
            {list.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="font-medium capitalize text-ink">{fmtDate(p.date)}</span>
                <span className="flex items-center gap-3 text-ink-muted">
                  <Badge tone={p.heureEntree ? 'success' : 'neutral'}>
                    Entrée {p.heureEntree ?? '—'}
                  </Badge>
                  <Badge tone={p.heureSortie ? 'success' : 'neutral'}>
                    Sortie {p.heureSortie ?? '—'}
                  </Badge>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
