import { Link } from 'react-router-dom';
import {
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  Clock,
  FolderKanban,
  Mail,
  MessagesSquare,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@drwindesk/ui';
import { pendingPointagesCount } from '@/lib/offlineQueue';

interface Action {
  to: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  tone: string;
}

const ACTIONS: Action[] = [
  { to: '/mon-pointage', label: 'Pointer', hint: 'Entrée / sortie', icon: Clock, tone: 'bg-brand-soft text-brand-soft-fg' },
  { to: '/agenda', label: 'Agenda', hint: 'Ma journée', icon: CalendarDays, tone: 'bg-brand-soft text-brand-soft-fg' },
  { to: '/mes-demandes', label: 'Demander', hint: 'Permission, congé, repos', icon: CalendarClock, tone: 'bg-success-soft text-success-soft-fg' },
  { to: '/mes-validations', label: 'Valider', hint: 'Mes validations', icon: ClipboardCheck, tone: 'bg-warning-soft text-warning-soft-fg' },
  { to: '/discussion', label: 'Discussion', hint: 'Messages internes', icon: MessagesSquare, tone: 'bg-brand-soft text-brand-soft-fg' },
  { to: '/mail', label: 'Mail', hint: 'Boîte de réception', icon: Mail, tone: 'bg-surface-muted text-ink-muted' },
  { to: '/mes-taches', label: 'Mes tâches', hint: 'À faire', icon: FolderKanban, tone: 'bg-success-soft text-success-soft-fg' },
];

export function AccueilRapidePage() {
  const pending = pendingPointagesCount();

  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-ink">Accueil rapide</h2>
        <p className="text-ink-muted">Les gestes du quotidien, en un tap.</p>
      </header>

      {pending > 0 && (
        <div className="rounded-xl border border-warning/30 bg-warning-soft/40 px-4 py-2.5 text-sm text-ink">
          {pending} pointage{pending > 1 ? 's' : ''} en attente de synchronisation (hors-ligne).
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {ACTIONS.map((a) => (
          <Link
            key={a.to}
            to={a.to}
            className="flex flex-col gap-2 rounded-2xl border border-surface-border bg-surface-elevated p-4 transition-colors active:bg-surface-muted"
          >
            <span className={cn('flex h-12 w-12 items-center justify-center rounded-xl', a.tone)}>
              <a.icon size={24} />
            </span>
            <div>
              <div className="font-semibold text-ink">{a.label}</div>
              <div className="text-xs text-ink-subtle">{a.hint}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
