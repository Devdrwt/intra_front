import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight, ExternalLink, Link2, Plus, Trash2, X } from 'lucide-react';
import { Button, Card, Input, Spinner, cn } from '@drwindesk/ui';
import { toast } from '@/lib/toast';
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

export function AgendaPage() {
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [selected, setSelected] = useState(() => ymd(new Date()));
  const [openForm, setOpenForm] = useState(false);

  const { data: items, isLoading } = useAgenda();

  // Index items par jour (sur la date de début).
  const byDay = useMemo(() => {
    const map = new Map<string, AgendaItem[]>();
    for (const it of items ?? []) {
      const key = ymd(new Date(it.debut));
      const arr = map.get(key) ?? [];
      arr.push(it);
      map.set(key, arr);
    }
    return map;
  }, [items]);

  // Grille du mois (lundi → dimanche, 6 semaines).
  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
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
  const selectedItems = (byDay.get(selected) ?? []).sort((a, b) => a.debut.localeCompare(b.debut));

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
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-ink">Mon agenda</h2>
          <p className="text-ink-muted">Mes événements + congés, formations, studio, échéances…</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={subscribe}><Link2 size={16} /> S'abonner (iCal)</Button>
          <Button onClick={() => setOpenForm((v) => !v)}>{openForm ? <X size={16} /> : <Plus size={16} />} Événement</Button>
        </div>
      </header>

      {openForm && <EventForm date={selected} onDone={() => setOpenForm(false)} />}

      {/* Légende sources */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
        {(Object.keys(SOURCE) as AgendaSource[]).map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SOURCE[s].color }} />
            {SOURCE[s].label}
          </span>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* Calendrier mois */}
        <Card className="p-3">
          <div className="mb-2 flex items-center justify-between px-1">
            <button onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))} className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-muted"><ChevronLeft size={18} /></button>
            <span className="font-semibold capitalize text-ink">{cursor.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
            <button onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))} className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-muted"><ChevronRight size={18} /></button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map((w) => <div key={w} className="py-1 text-center text-[11px] font-medium uppercase text-ink-subtle">{w}</div>)}
            {isLoading ? (
              <div className="col-span-7 flex justify-center py-10"><Spinner /></div>
            ) : (
              cells.map((d) => {
                const key = ymd(d);
                const dayItems = byDay.get(key) ?? [];
                const inMonth = d.getMonth() === cursor.getMonth();
                return (
                  <button
                    key={key}
                    onClick={() => setSelected(key)}
                    className={cn(
                      'flex min-h-[60px] flex-col gap-1 rounded-lg border p-1.5 text-left transition-colors',
                      key === selected ? 'border-brand-500 bg-brand-soft/40' : 'border-transparent hover:bg-surface-muted',
                      !inMonth && 'opacity-40',
                    )}
                  >
                    <span className={cn('text-xs font-medium', key === todayKey ? 'flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white' : 'text-ink')}>{d.getDate()}</span>
                    <div className="flex flex-wrap gap-0.5">
                      {dayItems.slice(0, 4).map((it) => (
                        <span key={it.id} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: SOURCE[it.source].color }} />
                      ))}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </Card>

        {/* Liste du jour sélectionné */}
        <Card className="p-0">
          <div className="border-b border-surface-border p-4">
            <div className="flex items-center gap-2 text-ink">
              <CalendarDays size={18} className="text-brand-600" />
              <span className="font-semibold capitalize">
                {new Date(selected).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
            </div>
          </div>
          <ul className="divide-y divide-surface-border">
            {selectedItems.length === 0 && <li className="px-4 py-6 text-sm text-ink-subtle">Aucun événement ce jour.</li>}
            {selectedItems.map((it) => <DayItem key={it.id} it={it} />)}
          </ul>
        </Card>
      </div>
    </div>
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
        <button onClick={() => del.mutate(it.id)} disabled={del.isPending} className="text-ink-subtle hover:text-danger"><Trash2 size={15} /></button>
      ) : it.url ? (
        <Link to={it.url} className="text-ink-subtle hover:text-brand-600"><ExternalLink size={15} /></Link>
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
    <Card>
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
    </Card>
  );
}
