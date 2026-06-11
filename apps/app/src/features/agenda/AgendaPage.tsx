import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, ChevronLeft, ChevronRight, ExternalLink, Link2, Plus, Trash2 } from 'lucide-react';
import { Button, Card, EmptyState, Input, Modal, PageHeader, Spinner, cn } from '@drwindesk/ui';
import { toast } from '@/lib/toast';
import { Stagger, StaggerItem } from '@/components/motion';
import { agendaService } from './service';
import { useAgenda, useCreateEvenement, useDeleteEvenement } from './hooks';
import type { AgendaItem, AgendaSource } from './service';

const SOURCE: Record<AgendaSource, { label: string; color: string }> = {
  PERSO: { label: 'Perso', color: '#4F46E5' },
  CONGE: { label: 'Congé', color: '#16A34A' },
  FORMATION: { label: 'Formation', color: '#D97706' },
  STUDIO: { label: 'Studio', color: '#9333EA' },
  TACHE: { label: 'Tâche', color: '#2563EB' },
  AO: { label: 'Appel d’offres', color: '#DC2626' },
  PAIE: { label: 'Paie', color: '#64748B' },
};

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const heure = (iso: string) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
const firstOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const longDate = (key: string) =>
  new Date(key).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

export function AgendaPage() {
  const [view, setView] = useState<'mois' | 'agenda'>('mois');
  const [cursor, setCursor] = useState(() => firstOfMonth(new Date()));
  const [dir, setDir] = useState(0);
  const [selected, setSelected] = useState(() => ymd(new Date()));
  const [openForm, setOpenForm] = useState(false);

  const { data: items, isLoading } = useAgenda();

  const byDay = useMemo(() => {
    const map = new Map<string, AgendaItem[]>();
    for (const it of items ?? []) {
      const key = ymd(new Date(it.debut));
      const arr = map.get(key) ?? [];
      arr.push(it);
      map.set(key, arr);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.debut.localeCompare(b.debut));
    return map;
  }, [items]);

  const cells = useMemo(() => {
    const first = firstOfMonth(cursor);
    const offset = (first.getDay() + 6) % 7;
    const start = new Date(first);
    start.setDate(1 - offset);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor]);

  const todayKey = ymd(new Date());
  const monthKey = `${cursor.getFullYear()}-${cursor.getMonth()}`;
  const selectedItems = byDay.get(selected) ?? [];

  const goMonth = (delta: number) => {
    setDir(delta);
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  };
  const goToday = () => {
    const n = new Date();
    setDir(0);
    setCursor(firstOfMonth(n));
    setSelected(ymd(n));
  };

  const subscribe = async () => {
    const { url } = await agendaService.icalUrl();
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Lien iCal copié — collez-le dans Google Agenda / Outlook.');
    } catch {
      toast.success(`Lien iCal : ${url}`);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Mon agenda"
        subtitle="Mes événements + congés, formations, studio, échéances…"
        actions={
          <>
            <div className="flex rounded-xl bg-surface-muted p-1">
              {(['mois', 'agenda'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors',
                    view === v ? 'bg-surface text-ink shadow-soft' : 'text-ink-muted hover:text-ink',
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
            <Button variant="secondary" onClick={subscribe}>
              <Link2 size={16} /> iCal
            </Button>
            <Button onClick={() => setOpenForm(true)}>
              <Plus size={16} /> Événement
            </Button>
          </>
        }
      />

      {/* Légende sources */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
        {(Object.keys(SOURCE) as AgendaSource[]).map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SOURCE[s].color }} />
            {SOURCE[s].label}
          </span>
        ))}
      </div>

      {view === 'mois' ? (
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          {/* Calendrier mois */}
          <Card className="p-3">
            <div className="mb-2 flex items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-1">
                <button onClick={() => goMonth(-1)} className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-muted">
                  <ChevronLeft size={18} />
                </button>
                <button onClick={() => goMonth(1)} className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-muted">
                  <ChevronRight size={18} />
                </button>
                <button onClick={goToday} className="ml-1 rounded-lg px-2.5 py-1 text-sm font-medium text-ink-muted hover:bg-surface-muted hover:text-ink">
                  Aujourd’hui
                </button>
              </div>
              <span className="font-semibold capitalize text-ink">
                {cursor.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {WEEKDAYS.map((w) => (
                <div key={w} className="py-1 text-center text-[11px] font-medium uppercase text-ink-subtle">
                  {w}
                </div>
              ))}
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            ) : (
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={monthKey}
                  initial={{ opacity: 0, x: dir >= 0 ? 22 : -22 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: dir >= 0 ? -22 : 22 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="grid grid-cols-7 gap-1"
                >
                  {cells.map((d) => {
                    const key = ymd(d);
                    const dayItems = byDay.get(key) ?? [];
                    const inMonth = d.getMonth() === cursor.getMonth();
                    return (
                      <button
                        key={key}
                        onClick={() => setSelected(key)}
                        className={cn(
                          'flex min-h-[86px] flex-col gap-1 rounded-lg border p-1.5 text-left align-top transition-colors',
                          key === selected ? 'border-brand-500 bg-brand-soft/40' : 'border-transparent hover:bg-surface-muted',
                          !inMonth && 'opacity-40',
                        )}
                      >
                        <span
                          className={cn(
                            'text-xs font-medium',
                            key === todayKey ? 'flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white' : 'text-ink',
                          )}
                        >
                          {d.getDate()}
                        </span>
                        <div className="min-w-0 space-y-0.5">
                          {dayItems.slice(0, 2).map((it) => (
                            <div key={it.id} className="flex items-center gap-1 truncate text-[10px] leading-tight">
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: SOURCE[it.source].color }} />
                              <span className="truncate text-ink">{it.titre}</span>
                            </div>
                          ))}
                          {dayItems.length > 2 && (
                            <div className="text-[10px] font-medium text-ink-subtle">+{dayItems.length - 2}</div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            )}
          </Card>

          {/* Liste du jour sélectionné */}
          <Card className="p-0">
            <div className="border-b border-surface-border p-4">
              <div className="flex items-center gap-2 text-ink">
                <CalendarDays size={18} className="text-brand-600" />
                <span className="font-semibold capitalize">{longDate(selected)}</span>
              </div>
            </div>
            <ul className="divide-y divide-surface-border">
              {selectedItems.length === 0 && (
                <li className="px-4 py-6 text-sm text-ink-subtle">Aucun événement ce jour.</li>
              )}
              {selectedItems.map((it) => (
                <DayItem key={it.id} it={it} />
              ))}
            </ul>
          </Card>
        </div>
      ) : (
        <AgendaListView items={items} isLoading={isLoading} />
      )}

      <Modal open={openForm} onClose={() => setOpenForm(false)} title="Nouvel événement" size="md">
        <EventForm date={selected} onDone={() => setOpenForm(false)} />
      </Modal>
    </div>
  );
}

function AgendaListView({ items, isLoading }: { items?: AgendaItem[]; isLoading: boolean }) {
  const groups = useMemo(() => {
    const today0 = new Date();
    today0.setHours(0, 0, 0, 0);
    const upcoming = (items ?? [])
      .filter((it) => new Date(it.fin) >= today0)
      .sort((a, b) => a.debut.localeCompare(b.debut));
    const map = new Map<string, AgendaItem[]>();
    for (const it of upcoming) {
      const k = ymd(new Date(it.debut));
      const arr = map.get(k) ?? [];
      arr.push(it);
      map.set(k, arr);
    }
    return [...map.entries()];
  }, [items]);

  if (isLoading) {
    return (
      <Card className="flex justify-center py-12">
        <Spinner />
      </Card>
    );
  }
  if (groups.length === 0) {
    return (
      <Card className="p-0">
        <EmptyState icon={<CalendarDays size={20} />} title="Rien à venir" description="Aucun événement à venir." />
      </Card>
    );
  }
  return (
    <Stagger className="space-y-4">
      {groups.map(([key, list]) => (
        <StaggerItem key={key}>
          <Card className="overflow-hidden p-0">
            <div className="border-b border-surface-border bg-surface-muted px-4 py-2.5 text-sm font-semibold capitalize text-ink">
              {longDate(key)}
            </div>
            <ul className="divide-y divide-surface-border">
              {list.map((it) => (
                <DayItem key={it.id} it={it} />
              ))}
            </ul>
          </Card>
        </StaggerItem>
      ))}
    </Stagger>
  );
}

function DayItem({ it }: { it: AgendaItem }) {
  const del = useDeleteEvenement();
  const color = SOURCE[it.source].color;
  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <span className="mt-1 h-full w-1 rounded-full" style={{ backgroundColor: color, minHeight: 32 }} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase" style={{ color }}>{SOURCE[it.source].label}</span>
          {!it.journeeEntiere && <span className="text-xs text-ink-subtle">{heure(it.debut)}–{heure(it.fin)}</span>}
          {it.journeeEntiere && <span className="text-xs text-ink-subtle">Journée</span>}
        </div>
        <div className="truncate font-medium text-ink">{it.titre}</div>
        {it.lieu && <div className="text-xs text-ink-subtle">{it.lieu}</div>}
      </div>
      {it.editable ? (
        <button onClick={() => del.mutate(it.id)} disabled={del.isPending} className="text-ink-subtle hover:text-danger">
          <Trash2 size={15} />
        </button>
      ) : it.url ? (
        <Link to={it.url} className="text-ink-subtle hover:text-brand-600">
          <ExternalLink size={15} />
        </Link>
      ) : null}
    </li>
  );
}

function EventForm({ date, onDone }: { date: string; onDone: () => void }) {
  const create = useCreateEvenement();
  const [titre, setTitre] = useState('');
  const [d, setD] = useState(date);
  const [hd, setHd] = useState('09:00');
  const [hf, setHf] = useState('10:00');
  const [journee, setJournee] = useState(false);
  const [lieu, setLieu] = useState('');

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!titre.trim()) return;
    const debut = new Date(`${d}T${journee ? '00:00' : hd}:00`).toISOString();
    const fin = new Date(`${d}T${journee ? '23:59' : hf}:00`).toISOString();
    create.mutate({ titre: titre.trim(), debut, fin, journeeEntiere: journee, lieu: lieu || undefined });
    onDone();
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <Input id="titre" label="Titre *" value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Réunion, rendez-vous…" />
      <div className="grid gap-4 sm:grid-cols-4">
        <Input id="date" type="date" label="Date" value={d} onChange={(e) => setD(e.target.value)} />
        {!journee && <Input id="hd" type="time" label="De" value={hd} onChange={(e) => setHd(e.target.value)} />}
        {!journee && <Input id="hf" type="time" label="À" value={hf} onChange={(e) => setHf(e.target.value)} />}
        <Input id="lieu" label="Lieu" value={lieu} onChange={(e) => setLieu(e.target.value)} />
      </div>
      <label className="flex items-center gap-2 text-sm text-ink-muted">
        <input type="checkbox" checked={journee} onChange={(e) => setJournee(e.target.checked)} /> Journée entière
      </label>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onDone}>Annuler</Button>
        <Button type="submit" loading={create.isPending}>Ajouter</Button>
      </div>
    </form>
  );
}
