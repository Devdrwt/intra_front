import { NavLink } from 'react-router-dom';
import { CalendarClock, Clock, FolderKanban, Home, LayoutGrid, type LucideIcon } from 'lucide-react';
import { cn } from '@drwindesk/ui';

interface Item {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  center?: boolean;
}

const ITEMS: Item[] = [
  { to: '/', label: 'Accueil', icon: Home, end: true },
  { to: '/mon-pointage', label: 'Pointer', icon: Clock },
  { to: '/accueil-rapide', label: 'Actions', icon: LayoutGrid, center: true },
  { to: '/mes-demandes', label: 'Demandes', icon: CalendarClock },
  { to: '/mes-taches', label: 'Tâches', icon: FolderKanban },
];

/**
 * Barre de navigation basse — mobile uniquement (cachée ≥ lg). Accès en un tap aux
 * gestes du quotidien. Le bouton central ouvre l'écran « Accueil rapide ».
 */
export function MobileBottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-surface-border bg-surface/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {ITEMS.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          end={it.end}
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors',
              isActive ? 'text-brand-600' : 'text-ink-subtle',
            )
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={cn(
                  'flex items-center justify-center rounded-xl',
                  it.center ? 'h-9 w-9 -mt-3 bg-brand-600 text-white shadow-pop' : 'h-6 w-6',
                  it.center && isActive && 'bg-brand-700',
                )}
              >
                <it.icon size={it.center ? 20 : 20} />
              </span>
              <span>{it.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
