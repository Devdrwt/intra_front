import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Check, CheckSquare, Plus } from 'lucide-react';
import { Badge, Button, Card, CardTitle, EmptyState, Skeleton, cn } from '@drwindesk/ui';
import { tasksService, type TaskPriority } from './service';

const ACTIVE = new Set(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW']);
const PRIO_DOT: Record<TaskPriority, string> = {
  URGENT: 'bg-danger',
  HIGH: 'bg-warning',
  MEDIUM: 'bg-brand-500',
  LOW: 'bg-surface-border',
};
const isLate = (d?: string) => !!d && d < new Date().toISOString().slice(0, 10);

/** Aperçu des tâches en cours — cochables + ajout express. */
export function MesTachesWidget() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['tasks', 'mine'], queryFn: tasksService.myTasks });
  const active = (data ?? []).filter((t) => ACTIVE.has(t.statut));

  const complete = useMutation({
    mutationFn: (id: string) => tasksService.move(id, 'DONE'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
  const create = useMutation({
    mutationFn: (titre: string) => tasksService.create(titre, 'MEDIUM'),
    meta: { successMessage: 'Tâche ajoutée' },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const [titre, setTitre] = useState('');
  const add = (e: FormEvent) => {
    e.preventDefault();
    if (!titre.trim()) return;
    create.mutate(titre.trim());
    setTitre('');
  };

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
        <EmptyState icon={<CheckSquare size={20} />} title="Aucune tâche en cours" className="py-6" />
      ) : (
        <ul className="mt-3 space-y-1">
          {active.slice(0, 5).map((t) => (
            <li key={t.id} className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 hover:bg-surface-muted">
              <button
                onClick={() => complete.mutate(t.id)}
                disabled={complete.isPending}
                title="Marquer terminé"
                className="group flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-surface-border text-transparent transition-colors hover:border-success hover:text-success"
              >
                <Check size={12} className="opacity-0 group-hover:opacity-100" />
              </button>
              <span className={cn('h-2 w-2 shrink-0 rounded-full', PRIO_DOT[t.priorite])} />
              <span className="min-w-0 flex-1 truncate text-sm text-ink">{t.titre}</span>
              {isLate(t.dateEcheance) && <Badge tone="danger">En retard</Badge>}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} className="mt-3 flex gap-2 border-t border-surface-border pt-3">
        <input
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          placeholder="Ajouter une tâche…"
          className="flex-1 rounded-lg border border-surface-border bg-surface px-3 py-1.5 text-sm text-ink outline-none focus:border-brand-400"
        />
        <Button size="sm" type="submit" loading={create.isPending} disabled={!titre.trim()}>
          <Plus size={16} />
        </Button>
      </form>
    </Card>
  );
}
