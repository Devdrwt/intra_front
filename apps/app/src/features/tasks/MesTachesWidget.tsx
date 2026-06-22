import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CheckSquare } from 'lucide-react';
import { Badge, Card, CardTitle, EmptyState, Skeleton, cn } from '@drwindesk/ui';
import { tasksService, type TaskPriority } from './service';

const ACTIVE = new Set(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW']);
const PRIO_DOT: Record<TaskPriority, string> = {
  URGENT: 'bg-danger',
  HIGH: 'bg-warning',
  MEDIUM: 'bg-brand-500',
  LOW: 'bg-surface-border',
};

const isLate = (d?: string) => !!d && d < new Date().toISOString().slice(0, 10);

/** Aperçu des tâches en cours pour le tableau de bord. */
export function MesTachesWidget() {
  const { data, isLoading } = useQuery({ queryKey: ['me', 'tasks'], queryFn: tasksService.myTasks });
  const active = (data ?? []).filter((t) => ACTIVE.has(t.statut));

  return (
    <Card>
      <div className="flex items-center justify-between">
        <CardTitle>Mes tâches</CardTitle>
        <Link to="/mes-taches" className="text-sm font-medium text-brand-600 hover:underline">
          Voir tout
        </Link>
      </div>

      {isLoading ? (
        <div className="mt-4 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-9 rounded-lg" />
          ))}
        </div>
      ) : active.length === 0 ? (
        <EmptyState icon={<CheckSquare size={20} />} title="Aucune tâche en cours" className="py-8" />
      ) : (
        <ul className="mt-3 space-y-1.5">
          {active.slice(0, 5).map((t) => (
            <li key={t.id}>
              <Link to="/mes-taches" className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-muted">
                <span className={cn('h-2 w-2 shrink-0 rounded-full', PRIO_DOT[t.priorite])} />
                <span className="min-w-0 flex-1 truncate text-sm text-ink">{t.titre}</span>
                {isLate(t.dateEcheance) && <Badge tone="danger">En retard</Badge>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
