import { useMemo, useState, type DragEvent, type FormEvent } from 'react';
import { CalendarClock, ChevronRight, Plus, Tag, Trash2 } from 'lucide-react';
import { Badge, Button, Card, Input, Modal, PageHeader, Select, SkeletonRows, Textarea, cn } from '@drwindesk/ui';
import type { BadgeProps } from '@drwindesk/ui';
import { type Task, type TaskInput, type TaskPriority, type TaskStatus } from './service';
import { useCreateTask, useMoveTask, useMyTasksFull, useRemoveTask, useUpdateTask } from './hooks';

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
const PRIO_LABEL: Record<TaskPriority, string> = { URGENT: 'Urgent', HIGH: 'Haute', MEDIUM: 'Moyenne', LOW: 'Basse' };
const PRIO_OPTS = (Object.keys(PRIO_LABEL) as TaskPriority[]).map((value) => ({ value, label: PRIO_LABEL[value] }));
const STATUT_LABEL: Record<TaskStatus, string> = {
  BACKLOG: 'Backlog', TODO: 'À faire', IN_PROGRESS: 'En cours', IN_REVIEW: 'En revue', DONE: 'Terminé', CANCELLED: 'Annulé',
};
const STATUT_OPTS = (Object.keys(STATUT_LABEL) as TaskStatus[]).map((value) => ({ value, label: STATUT_LABEL[value] }));

const today = () => new Date().toISOString().slice(0, 10);
const isLate = (t: Task) => !!t.dateEcheance && t.dateEcheance < today() && t.statut !== 'DONE' && t.statut !== 'CANCELLED';

export function MesTachesPage() {
  const { data: tasks, isLoading } = useMyTasksFull();
  const move = useMoveTask();
  const create = useCreateTask();

  const [titre, setTitre] = useState('');
  const [priorite, setPriorite] = useState<TaskPriority>('MEDIUM');
  const [echeance, setEcheance] = useState('');
  const [search, setSearch] = useState('');
  const [onlyLate, setOnlyLate] = useState(false);
  const [edited, setEdited] = useState<Task | null>(null);
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null);

  const onDrop = (statut: TaskStatus) => (e: DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    setDragOver(null);
    const t = (tasks ?? []).find((x) => x.id === id);
    if (id && t && t.statut !== statut) move.mutate({ id, statut });
  };

  const onCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!titre.trim()) return;
    create.mutate({ titre: titre.trim(), priorite, dateEcheance: echeance || undefined });
    setTitre('');
    setEcheance('');
  };

  const filtered = useMemo(() => {
    let list = tasks ?? [];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((t) => t.titre.toLowerCase().includes(q) || (t.projetNom ?? '').toLowerCase().includes(q) || (t.labels ?? []).some((l) => l.toLowerCase().includes(q)));
    }
    if (onlyLate) list = list.filter(isLate);
    return list;
  }, [tasks, search, onlyLate]);

  const byCol = (s: TaskStatus) => filtered.filter((t) => t.statut === s);
  const lateCount = (tasks ?? []).filter(isLate).length;

  return (
    <div className="space-y-5">
      <PageHeader title="Mes tâches" subtitle="Tableau Kanban transverse — toutes vos tâches, tous projets." />

      <Card>
        <form onSubmit={onCreate} className="flex flex-wrap items-end gap-3">
          <Input id="t" label="Nouvelle tâche" value={titre} onChange={(e) => setTitre(e.target.value)} className="min-w-[220px] flex-1" placeholder="Que faut-il faire ?" />
          <Select id="p" label="Priorité" value={priorite} onChange={(e) => setPriorite(e.target.value as TaskPriority)} options={PRIO_OPTS} />
          <Input id="e" type="date" label="Échéance" value={echeance} onChange={(e) => setEcheance(e.target.value)} />
          <Button type="submit" loading={create.isPending}><Plus size={16} /> Ajouter</Button>
        </form>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Input id="q" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher (titre, projet, label)…" className="min-w-[220px] flex-1" />
        <button
          onClick={() => setOnlyLate((v) => !v)}
          className={cn('inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition', onlyLate ? 'border-danger bg-danger-soft text-danger' : 'border-surface-border text-ink-muted hover:text-ink')}
        >
          <CalendarClock size={15} /> En retard {lateCount > 0 && <Badge tone="danger">{lateCount}</Badge>}
        </button>
      </div>

      {isLoading ? (
        <Card className="p-0"><SkeletonRows rows={4} cols={4} /></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((col) => (
            <div
              key={col.key}
              onDragOver={(e) => { e.preventDefault(); setDragOver(col.key); }}
              onDragLeave={() => setDragOver((d) => (d === col.key ? null : d))}
              onDrop={onDrop(col.key)}
              className={cn(
                'rounded-2xl border bg-surface-muted/40 p-3 transition-colors',
                dragOver === col.key ? 'border-brand-400 bg-brand-soft/40 ring-2 ring-brand-300' : 'border-surface-border',
              )}
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <span className={cn('h-2 w-2 rounded-full', col.dot)} />
                  {col.label}
                </span>
                <Badge tone="neutral">{byCol(col.key).length}</Badge>
              </div>
              <div className="space-y-2">
                {byCol(col.key).map((t) => (
                  <TaskCard key={t.id} t={t} onMove={(s) => move.mutate({ id: t.id, statut: s })} onOpen={() => setEdited(t)} />
                ))}
                {byCol(col.key).length === 0 && <p className="px-1 py-2 text-xs text-ink-subtle">—</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!edited} onClose={() => setEdited(null)} title={edited?.titre ?? 'Tâche'} size="md">
        {edited && <TaskEditor task={edited} onDone={() => setEdited(null)} />}
      </Modal>
    </div>
  );
}

function TaskCard({ t, onMove, onOpen }: { t: Task; onMove: (s: TaskStatus) => void; onOpen: () => void }) {
  const next = NEXT[t.statut];
  const late = isLate(t);
  const prog = t.progression ?? 0;
  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.setData('text/plain', t.id); e.dataTransfer.effectAllowed = 'move'; }}
      className={cn('cursor-pointer rounded-xl border border-l-4 border-surface-border bg-surface-elevated p-3 shadow-sm transition-shadow hover:shadow-elevated active:cursor-grabbing', PRIO_ACCENT[t.priorite])}
      onClick={onOpen}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-ink">{t.titre}</span>
        <Badge tone={PRIO_TONE[t.priorite]}>{PRIO_LABEL[t.priorite]}</Badge>
      </div>
      <div className="mt-1 text-xs text-ink-subtle">
        {t.reference}{t.projetNom ? ` · ${t.projetNom}` : ''}
      </div>
      {t.dateEcheance && (
        <div className={cn('mt-1 inline-flex items-center gap-1 text-xs', late ? 'font-semibold text-danger' : 'text-ink-subtle')}>
          <CalendarClock size={12} /> {t.dateEcheance}{late ? ' (en retard)' : ''}
        </div>
      )}
      {(t.labels ?? []).length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {(t.labels ?? []).map((l) => (
            <span key={l} className="inline-flex items-center gap-0.5 rounded-md bg-surface-muted px-1.5 py-0.5 text-[10px] text-ink-muted"><Tag size={9} /> {l}</span>
          ))}
        </div>
      )}
      {prog > 0 && prog < 100 && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-muted">
          <div className="h-full rounded-full bg-brand-500" style={{ width: `${prog}%` }} />
        </div>
      )}
      {next && (
        <button
          onClick={(e) => { e.stopPropagation(); onMove(next); }}
          className="mt-2 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-brand-700 hover:bg-brand-soft"
        >
          Avancer <ChevronRight size={12} />
        </button>
      )}
    </div>
  );
}

function TaskEditor({ task, onDone }: { task: Task; onDone: () => void }) {
  const update = useUpdateTask();
  const remove = useRemoveTask();
  const [form, setForm] = useState<TaskInput>({
    titre: task.titre,
    description: task.description ?? '',
    statut: task.statut,
    priorite: task.priorite,
    dateEcheance: task.dateEcheance ?? '',
    progression: task.progression ?? 0,
  });
  const [labels, setLabels] = useState<string[]>(task.labels ?? []);
  const [labelInput, setLabelInput] = useState('');

  const set = <K extends keyof TaskInput>(k: K, v: TaskInput[K]) => setForm((f) => ({ ...f, [k]: v }));
  const addLabel = () => {
    const v = labelInput.trim();
    if (v && !labels.includes(v)) setLabels((l) => [...l, v]);
    setLabelInput('');
  };

  const onSave = (e: FormEvent) => {
    e.preventDefault();
    update.mutate(
      { id: task.id, input: { ...form, dateEcheance: form.dateEcheance || null, labels } },
      { onSuccess: onDone },
    );
  };

  return (
    <form onSubmit={onSave} className="grid gap-4">
      <Input id="ed-titre" label="Titre" value={form.titre ?? ''} onChange={(e) => set('titre', e.target.value)} />
      <Textarea id="ed-desc" label="Description" rows={3} value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} placeholder="Détails, contexte, critères…" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Select id="ed-statut" label="Statut" value={form.statut} onChange={(e) => set('statut', e.target.value as TaskStatus)} options={STATUT_OPTS} />
        <Select id="ed-prio" label="Priorité" value={form.priorite} onChange={(e) => set('priorite', e.target.value as TaskPriority)} options={PRIO_OPTS} />
        <Input id="ed-ech" type="date" label="Échéance" value={form.dateEcheance ?? ''} onChange={(e) => set('dateEcheance', e.target.value)} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink-muted">Progression : {form.progression ?? 0} %</label>
        <input type="range" min={0} max={100} step={5} value={form.progression ?? 0} onChange={(e) => set('progression', Number(e.target.value))} className="w-full accent-brand-500" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink-muted">Labels</label>
        <div className="flex flex-wrap gap-1.5">
          {labels.map((l) => (
            <button key={l} type="button" onClick={() => setLabels((x) => x.filter((y) => y !== l))} className="inline-flex items-center gap-1 rounded-md bg-surface-muted px-2 py-1 text-xs text-ink-muted hover:text-danger">
              <Tag size={11} /> {l} ✕
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <Input id="ed-label" value={labelInput} onChange={(e) => setLabelInput(e.target.value)} placeholder="Ajouter un label…" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLabel(); } }} className="flex-1" />
          <Button type="button" variant="secondary" onClick={addLabel}>Ajouter</Button>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-surface-border pt-4">
        <Button type="button" variant="ghost" onClick={() => remove.mutate(task.id, { onSuccess: onDone })} loading={remove.isPending} className="text-danger hover:bg-danger-soft">
          <Trash2 size={15} /> Supprimer
        </Button>
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onDone}>Annuler</Button>
          <Button type="submit" loading={update.isPending}>Enregistrer</Button>
        </div>
      </div>
    </form>
  );
}
