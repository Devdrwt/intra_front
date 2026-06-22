import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AlarmClock, CheckSquare, FolderKanban } from 'lucide-react';
import { Badge, Card, CardTitle, EmptyState, Skeleton } from '@drwindesk/ui';
import { tasksService } from '@/features/tasks/service';
import { useMyProjects } from '@/features/me/hooks';

const todayStr = () => new Date().toISOString().slice(0, 10);
const addDays = (d: string, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x.toISOString().slice(0, 10);
};
const DONE = new Set(['DONE', 'CANCELLED']);

interface Item {
  id: string;
  label: string;
  date: string;
  kind: 'task' | 'project';
  to: string;
}

/** « À ne pas oublier » : tâches & projets en retard ou dont l'échéance approche. */
export function EcheancesCard() {
  const { data: tasks, isLoading: lt } = useQuery({ queryKey: ['tasks', 'mine'], queryFn: tasksService.myTasks });
  const { data: projects, isLoading: lp } = useMyProjects();

  const today = todayStr();
  const horizon = addDays(today, 10);

  const items: Item[] = [];
  for (const t of tasks ?? []) {
    if (!t.dateEcheance || DONE.has(t.statut)) continue;
    if (t.dateEcheance <= horizon) {
      items.push({ id: `t-${t.id}`, label: t.titre, date: t.dateEcheance, kind: 'task', to: '/mes-taches' });
    }
  }
  for (const p of projects ?? []) {
    if (!p.dateFin || p.statut === 'LIVRE' || p.statut === 'ANNULE') continue;
    if (p.dateFin <= horizon) {
      items.push({ id: `p-${p.id}`, label: p.nom, date: p.dateFin, kind: 'project', to: '/mes-projets' });
    }
  }
  items.sort((a, b) => a.date.localeCompare(b.date));

  const fmtDelta = (date: string) => {
    const days = Math.round((new Date(date).getTime() - new Date(today).getTime()) / 86_400_000);
    if (days < 0) return { label: `Retard ${-days}j`, tone: 'danger' as const };
    if (days === 0) return { label: "Aujourd'hui", tone: 'warning' as const };
    if (days === 1) return { label: 'Demain', tone: 'warning' as const };
    return { label: `Dans ${days}j`, tone: 'neutral' as const };
  };

  return (
    <Card>
      <CardTitle>À ne pas oublier</CardTitle>
      {lt || lp ? (
        <div className="mt-4 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-9 rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={<AlarmClock size={20} />} title="Rien d’urgent" className="py-8" />
      ) : (
        <ul className="mt-3 space-y-1.5">
          {items.slice(0, 6).map((it) => {
            const d = fmtDelta(it.date);
            return (
              <li key={it.id}>
                <Link to={it.to} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-muted">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-ink-subtle">
                    {it.kind === 'task' ? <CheckSquare size={14} /> : <FolderKanban size={14} />}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-ink">{it.label}</span>
                  <Badge tone={d.tone} dot={d.tone !== 'neutral'}>{d.label}</Badge>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
