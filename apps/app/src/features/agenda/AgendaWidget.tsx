import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Card, CardTitle, Spinner, cn } from '@drwindesk/ui';
import { useAgenda } from './hooks';
import type { AgendaItem, AgendaSource } from './service';

const COLOR: Record<AgendaSource, string> = {
  PERSO: '#4F46E5',
  CONGE: '#16A34A',
  FORMATION: '#D97706',
  STUDIO: '#9333EA',
  TACHE: '#2563EB',
  AO: '#DC2626',
  PAIE: '#64748B',
};
const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const heure = (iso: string) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

/** Aperçu calendrier compact pour le tableau de bord. */
export function AgendaWidget() {
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [selected, setSelected] = useState(() => ymd(new Date()));
  const { data: items, isLoading } = useAgenda();

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
  const dayItems = (byDay.get(selected) ?? []).sort((a, b) => a.debut.localeCompare(b.debut));

  // Si le jour sélectionné est vide → on montre les prochains événements (plus utile).
  const upcoming = useMemo(() => {
    const now = new Date();
    return (items ?? [])
      .filter((it) => new Date(it.fin) >= now)
      .sort((a, b) => a.debut.localeCompare(b.debut))
      .slice(0, 4);
  }, [items]);
  const showUpcoming = dayItems.length === 0;
  const panelItems = showUpcoming ? upcoming : dayItems.slice(0, 5);

  return (
    <Card>
      <div className="flex items-center justify-between">
        <CardTitle>Mon agenda</CardTitle>
        <Link to="/agenda" className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">
          Ouvrir <ExternalLink size={13} />
        </Link>
      </div>

      <div className="mt-4 grid gap-5 sm:grid-cols-2">
        {/* Mini calendrier */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <button onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))} className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-muted"><ChevronLeft size={16} /></button>
            <span className="text-sm font-semibold capitalize text-ink">{cursor.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
            <button onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))} className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-muted"><ChevronRight size={16} /></button>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : (
            <div className="grid grid-cols-7 gap-0.5">
              {WEEKDAYS.map((w, i) => <div key={i} className="py-1 text-center text-[10px] font-medium text-ink-subtle">{w}</div>)}
              {cells.map((d) => {
                const key = ymd(d);
                const has = byDay.get(key) ?? [];
                const inMonth = d.getMonth() === cursor.getMonth();
                return (
                  <button
                    key={key}
                    onClick={() => setSelected(key)}
                    className={cn(
                      'flex aspect-square flex-col items-center justify-center rounded-lg text-xs transition-colors',
                      key === selected ? 'bg-brand-soft font-semibold text-brand-soft-fg' : 'hover:bg-surface-muted',
                      !inMonth && 'opacity-40',
                    )}
                  >
                    <span className={cn(key === todayKey && 'flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white')}>{d.getDate()}</span>
                    <span className="mt-0.5 flex h-1.5 gap-0.5">
                      {has.slice(0, 3).map((it) => <span key={it.id} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLOR[it.source] }} />)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Événements du jour / à venir */}
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-ink">
            <CalendarDays size={15} className="text-brand-600" />
            <span className="capitalize">
              {showUpcoming
                ? 'Prochains événements'
                : new Date(selected).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })}
            </span>
          </div>
          {panelItems.length === 0 ? (
            <p className="py-4 text-sm text-ink-subtle">Rien à venir.</p>
          ) : (
            <ul className="space-y-2">
              {panelItems.map((it) => (
                <li key={it.id} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: COLOR[it.source] }} />
                  <div className="min-w-0">
                    <div className="truncate text-sm text-ink">{it.titre}</div>
                    <div className="text-xs text-ink-subtle">
                      {showUpcoming && (
                        <span className="capitalize">
                          {new Date(it.debut).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} ·{' '}
                        </span>
                      )}
                      {it.journeeEntiere ? 'Journée' : `${heure(it.debut)}–${heure(it.fin)}`}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}
