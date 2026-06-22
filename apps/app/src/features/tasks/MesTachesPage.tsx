import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Plus } from 'lucide-react';
import { Badge, Button, Card, Input, PageHeader, Select, SkeletonRows, cn } from '@drwindesk/ui';
import type { BadgeProps } from '@drwindesk/ui';
import { tasksService, type Task, type TaskPriority, type TaskStatus } from './service';

const COLUMNS: { key: TaskStatus; label: string; dot: string }[] = [
  { key: 'TODO', label: 'À faire', dot: 'bg-slate-400' },
  { key: 'IN_PROGRESS', label: 'En cours', dot: 'bg-brand-500' },
  { key: 'IN_REVIEW', label: 'En revue', dot: 'bg-amber-500' },
  { key: 'DONE', label: 'Terminé', dot: 'bg-emerald-500' },
];
const PRIO_ACCENT: Record<TaskPriority, string> = {
  URGENT: 'border-l-danger',
  HIGH: 'border-l-warning',
  MEDIUM: 'border-l-brand-400',
  LOW: 'border-l-surface-border',
};
const NEXT: Partial<Record<TaskStatus, TaskStatus>> = {
  TODO: 'IN_PROGRESS',
  IN_PROGRESS: 'IN_REVIEW',
  IN_REVIEW: 'DONE',
};
const PRIO_TONE: Record<TaskPriority, NonNullable<BadgeProps['tone']>> = {
  URGENT: 'danger',
  HIGH: 'warning',
  MEDIUM: 'neutral',
  LOW: 'neutral',
};

export function MesTachesPage() {
  const qc = useQueryClient();
  const { data: tasks, isLoading } = useQuery({ queryKey: ['tasks', 'mine'], queryFn: tasksService.myTasks });
  const move = useMutation({
    mutationFn: ({ id, statut }: { id: string; statut: TaskStatus }) => tasksService.move(id, statut),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
  const create = useMutation({
    mutationFn: ({ titre, priorite }: { titre: string; priorite: TaskPriority }) => tasksService.create(titre, priorite),
    meta: { successMessage: 'Tâche créée' },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const [titre, setTitre] = useState('');
  const [priorite, setPriorite] = useState<TaskPriority>('MEDIUM');

  const onCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!titre.trim()) return;
    create.mutate({ titre: titre.trim(), priorite });
    setTitre('');
  };

  const byCol = (s: TaskStatus) => (tasks ?? []).filter((t) => t.statut === s);

  return (
    <div className="space-y-5">
      <PageHeader title="Mes tâches" subtitle="Tableau Kanban transverse — toutes vos tâches, tous projets." />

      <Card>
        <form onSubmit={onCreate} className="flex flex-wrap items-end gap-3">
          <Input id="t" label="Nouvelle tâche" value={titre} onChange={(e) => setTitre(e.target.value)} className="min-w-[220px] flex-1" placeholder="Que faut-il faire ?" />
          <Select id="p" label="Priorité" value={priorite} onChange={(e) => setPriorite(e.target.value as TaskPriority)}
            options={[{ value: 'URGENT', label: 'Urgent' }, { value: 'HIGH', label: 'Haute' }, { value: 'MEDIUM', label: 'Moyenne' }, { value: 'LOW', label: 'Basse' }]} />
          <Button type="submit" loading={create.isPending}><Plus size={16} /> Ajouter</Button>
        </form>
      </Card>

      {isLoading ? (
        <Card className="p-0"><SkeletonRows rows={4} cols={4} /></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.key} className="rounded-2xl border border-surface-border bg-surface-muted/40 p-3">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <span className={cn('h-2 w-2 rounded-full', col.dot)} />
                  {col.label}
                </span>
                <Badge tone="neutral">{byCol(col.key).length}</Badge>
              </div>
              <div className="space-y-2">
                {byCol(col.key).map((t) => (
                  <TaskCard key={t.id} t={t} onMove={(s) => move.mutate({ id: t.id, statut: s })} />
                ))}
                {byCol(col.key).length === 0 && <p className="px-1 py-2 text-xs text-ink-subtle">—</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TaskCard({ t, onMove }: { t: Task; onMove: (s: TaskStatus) => void }) {
  const next = NEXT[t.statut];
  return (
    <div className={cn('rounded-xl border border-l-4 border-surface-border bg-surface-elevated p-3 shadow-sm transition-shadow hover:shadow-elevated', PRIO_ACCENT[t.priorite])}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-ink">{t.titre}</span>
        <Badge tone={PRIO_TONE[t.priorite]}>{t.priorite}</Badge>
      </div>
      <div className="mt-1 text-xs text-ink-subtle">
        {t.reference}{t.projetNom ? ` · ${t.projetNom}` : ''}{t.dateEcheance ? ` · ${t.dateEcheance}` : ''}
      </div>
      {next && (
        <button
          onClick={() => onMove(next)}
          className={cn('mt-2 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-brand-700 hover:bg-brand-soft')}
        >
          Avancer <ChevronRight size={12} />
        </button>
      )}
    </div>
  );
}
