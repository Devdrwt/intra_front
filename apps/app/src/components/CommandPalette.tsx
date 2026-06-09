import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarClock,
  CornerDownLeft,
  FileBarChart,
  FileText,
  Moon,
  Plus,
  Search,
  Sun,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@drwindesk/ui';
import { MODULES } from '@/config/modules';
import { hasPermission, useAuth } from '@/auth/AuthContext';
import { useTheme } from '@/theme/ThemeProvider';
import { useGlobalSearch } from '@/features/search/hooks';

interface Item {
  id: string;
  label: string;
  group: string;
  icon: LucideIcon;
  run: () => void;
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { resolved, toggle } = useTheme();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo<Item[]>(() => {
    const go = (path: string) => () => {
      navigate(path);
      onClose();
    };
    const nav: Item[] = MODULES.filter((m) => !m.requires || hasPermission(user, m.requires)).map(
      (m) => ({ id: `nav:${m.path}`, label: m.label, group: 'Aller à', icon: m.icon, run: go(m.path) }),
    );
    const actions: Item[] = [
      ...(hasPermission(user, 'rapport:manage')
        ? [{ id: 'a:rapport', label: 'Saisir un rapport', group: 'Actions' as const, icon: FileBarChart, run: go('/rapports/nouveau') }]
        : []),
      ...(hasPermission(user, 'rh.employe:read')
        ? [{ id: 'a:employe', label: 'Nouvel employé', group: 'Actions' as const, icon: Plus, run: go('/rh/nouveau') }]
        : []),
      ...(hasPermission(user, 'presence:manage')
        ? [{ id: 'a:conge', label: 'Demander un congé', group: 'Actions' as const, icon: CalendarClock, run: go('/presences/conges/nouveau') }]
        : []),
      ...(hasPermission(user, 'user:read')
        ? [{ id: 'a:invite', label: 'Inviter un membre', group: 'Actions' as const, icon: UserPlus, run: go('/utilisateurs') }]
        : []),
      {
        id: 'a:theme',
        label: resolved === 'dark' ? 'Passer en thème clair' : 'Passer en thème sombre',
        group: 'Actions',
        icon: resolved === 'dark' ? Sun : Moon,
        run: () => {
          toggle();
          onClose();
        },
      },
    ];
    return [...nav, ...actions];
  }, [navigate, onClose, user, resolved, toggle]);

  // Résultats de recherche live (employés, tickets, documents…), scopés permissions backend.
  const { data: searchData } = useGlobalSearch(query);
  const searchItems = useMemo<Item[]>(() => {
    const go = (path: string) => () => {
      navigate(path);
      onClose();
    };
    return (searchData?.groups ?? []).flatMap((grp) =>
      grp.items.map((hit) => ({
        id: `s:${hit.type}:${hit.entityId}`,
        label: hit.subtitle ? `${hit.title} — ${hit.subtitle}` : hit.title,
        group: grp.label,
        icon: FileText,
        run: go(hit.url),
      })),
    );
  }, [searchData, navigate, onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q ? items.filter((i) => i.label.toLowerCase().includes(q)) : items;
    return [...base, ...searchItems];
  }, [items, query, searchItems]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => setActive(0), [query]);

  if (!open) return null;

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      filtered[active]?.run();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  let lastGroup = '';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]">
      <div className="absolute inset-0 animate-fade-in bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-lg animate-slide-up overflow-hidden rounded-2xl border border-surface-border bg-surface-elevated shadow-pop"
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-surface-border px-4">
          <Search size={18} className="text-ink-subtle" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une page ou une action…"
            className="h-12 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
          />
          <kbd className="hidden rounded-md border border-surface-border px-1.5 py-0.5 text-[10px] font-medium text-ink-subtle sm:block">
            Échap
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-subtle">Aucun résultat.</p>
          ) : (
            filtered.map((item, i) => {
              const showGroup = item.group !== lastGroup;
              lastGroup = item.group;
              return (
                <div key={item.id}>
                  {showGroup && (
                    <p className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
                      {item.group}
                    </p>
                  )}
                  <button
                    onMouseEnter={() => setActive(i)}
                    onClick={() => item.run()}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm transition-colors',
                      i === active ? 'bg-brand-soft text-brand-soft-fg' : 'text-ink hover:bg-surface-muted',
                    )}
                  >
                    <item.icon size={16} className={i === active ? '' : 'text-ink-subtle'} />
                    <span className="flex-1">{item.label}</span>
                    {i === active && <CornerDownLeft size={14} className="opacity-60" />}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
