import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2,
  ChevronDown,
  ChevronRight,
  LifeBuoy,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Star,
  X,
} from 'lucide-react';
import { Avatar, cn } from '@drwindesk/ui';
import { MobileBottomNav } from './MobileBottomNav';
import { MODULES, MODULE_GROUPS } from '@/config/modules';
import { ORG_NAME } from '@/lib/config';
import { avatarUrl } from '@/lib/avatar';
import { orgLogoUrl } from '@/lib/branding';
import { displayName, hasPermission, useAuth } from '@/auth/AuthContext';
import { useMyProfile } from '@/features/me/hooks';
import { useUnreadCount } from '@/features/discussion/hooks';
import { NotificationBell } from '@/features/espaces/NotificationBell';
import { ThemeToggle } from '@/theme/ThemeToggle';
import { CommandPalette } from '@/components/CommandPalette';
import { useNotificationSound } from '@/hooks/useNotificationSound';

const COLLAPSE_KEY = 'drwindesk.sidebar.collapsed';
const NAV_GROUPS_KEY = 'drwindesk.nav.openGroups';
const NAV_FAV_KEY = 'drwindesk.nav.favorites';

export function AppLayout() {
  const { user, logout } = useAuth();
  const { data: profile } = useMyProfile();
  const avatarSrc = user ? avatarUrl(user.userId, profile?.hasAvatar ?? false) : undefined;
  const location = useLocation();

  useNotificationSound();

  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === '1');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  const modules = MODULES.filter((m) => !m.requires || hasPermission(user, m.requires));
  const current = [...modules]
    .sort((a, b) => b.path.length - a.path.length)
    .find((m) =>
      m.path === '/' ? location.pathname === '/' : location.pathname.startsWith(m.path),
    );

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1');
      return !c;
    });
  };

  // Raccourci ⌘K / Ctrl+K → palette de commandes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Ferme le drawer mobile à chaque navigation.
  useEffect(() => setMobileOpen(false), [location.pathname]);

  return (
    <div className="min-h-screen bg-surface-muted text-ink">
      {/* Sidebar desktop */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-surface-border bg-surface transition-[width] duration-200 lg:flex',
          collapsed ? 'w-[4.5rem]' : 'w-64',
        )}
      >
        <SidebarContent collapsed={collapsed} modules={modules} location={location.pathname} />
        <SidebarFooter collapsed={collapsed} onToggle={toggleCollapsed} />
      </aside>

      {/* Drawer mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-ink/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 animate-slide-up flex-col border-r border-surface-border bg-surface">
            <div className="flex h-16 items-center justify-between px-4">
              <Brand />
              <button
                onClick={() => setMobileOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-ink-muted hover:bg-surface-muted"
              >
                <X size={18} />
              </button>
            </div>
            <SidebarContent collapsed={false} modules={modules} location={location.pathname} hideBrand />
          </aside>
        </div>
      )}

      {/* Colonne principale */}
      <div className={cn('flex min-h-screen flex-col transition-[padding] duration-200', collapsed ? 'lg:pl-[4.5rem]' : 'lg:pl-64')}>
        <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-surface-border bg-surface/80 px-3 backdrop-blur sm:px-5">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-ink-muted hover:bg-surface-muted lg:hidden"
            aria-label="Ouvrir le menu"
          >
            <Menu size={20} />
          </button>

          {/* Fil d'Ariane */}
          <nav className="hidden min-w-0 items-center gap-1.5 text-sm sm:flex">
            <span className="text-ink-subtle">DrwinDesk</span>
            <ChevronRight size={15} className="text-ink-subtle" />
            <span className="truncate font-semibold text-ink">{current?.label ?? 'Espace'}</span>
          </nav>

          <div className="flex-1" />

          {/* Recherche / palette */}
          <button
            onClick={() => setCmdOpen(true)}
            className="hidden items-center gap-2 rounded-xl border border-surface-border bg-surface-muted px-3 py-1.5 text-sm text-ink-subtle transition-colors hover:text-ink sm:flex"
          >
            <Search size={15} />
            <span>Rechercher…</span>
            <kbd className="ml-2 rounded-md border border-surface-border bg-surface px-1.5 py-0.5 text-[10px] font-medium">
              ⌘K
            </kbd>
          </button>
          <button
            onClick={() => setCmdOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-ink-muted hover:bg-surface-muted sm:hidden"
            aria-label="Rechercher"
          >
            <Search size={18} />
          </button>

          <ThemeToggle />
          <NotificationBell />
          <div className="mx-1 hidden h-6 w-px bg-surface-border sm:block" />
          <UserMenu
            name={user ? displayName(user) : 'Collaborateur'}
            email={user?.email ?? ''}
            avatarSrc={avatarSrc}
            canSettings={hasPermission(user, 'settings:manage')}
            onLogout={logout}
          />
        </header>

        <main className="flex-1 pb-20 lg:pb-0">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </motion.div>
          </div>
        </main>
      </div>

      <MobileBottomNav />
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  );
}

function Brand({ collapsed }: { collapsed?: boolean }) {
  const [noLogo, setNoLogo] = useState(false);
  return (
    <div className="flex items-center gap-2.5">
      {noLogo ? (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white shadow-sm">
          D
        </span>
      ) : (
        <img
          src={orgLogoUrl()}
          alt="Logo"
          onError={() => setNoLogo(true)}
          className="h-9 w-9 shrink-0 rounded-xl object-contain"
        />
      )}
      {!collapsed && (
        <span className="text-lg font-semibold tracking-tight">
          Drwin<span className="text-brand-600">Desk</span>
        </span>
      )}
    </div>
  );
}

function SidebarContent({
  collapsed,
  modules,
  location,
  hideBrand,
}: {
  collapsed: boolean;
  modules: typeof MODULES;
  location: string;
  hideBrand?: boolean;
}) {
  const { data: unreadMessages = 0 } = useUnreadCount();
  const groups = MODULE_GROUPS.map((g) => ({
    group: g,
    items: modules.filter((m) => m.group === g),
  })).filter((g) => g.items.length > 0);

  const isActive = (path: string) => (path === '/' ? location === '/' : location.startsWith(path));
  const activeGroup = modules.find((m) => isActive(m.path))?.group;

  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(NAV_GROUPS_KEY);
      if (raw) return new Set<string>(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    return new Set<string>([MODULE_GROUPS[0], activeGroup].filter(Boolean) as string[]);
  });

  const toggleGroup = (g: string) =>
    setOpenGroups((prev) => {
      const next = new Set(prev);
      next.has(g) ? next.delete(g) : next.add(g);
      try {
        localStorage.setItem(NAV_GROUPS_KEY, JSON.stringify([...next]));
      } catch {
        /* ignore */
      }
      return next;
    });

  // Le groupe de la page active reste toujours déplié ; en mode icônes, tout est visible.
  const groupOpen = (g: string) => collapsed || g === activeGroup || openGroups.has(g);

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(NAV_FAV_KEY);
      if (raw) return JSON.parse(raw) as string[];
    } catch {
      /* ignore */
    }
    return [];
  });
  const toggleFav = (path: string) =>
    setFavorites((prev) => {
      const next = prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path];
      try {
        localStorage.setItem(NAV_FAV_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  const favSet = new Set(favorites);
  const pinned = favorites
    .map((p) => modules.find((m) => m.path === p))
    .filter(Boolean) as typeof MODULES;

  const badgeFor = (path: string) => (path === '/discussion' ? unreadMessages : 0);

  return (
    <>
      {!hideBrand && (
        <div className={cn('flex h-16 items-center px-4', collapsed && 'justify-center px-0')}>
          <Brand collapsed={collapsed} />
        </div>
      )}
      <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-2">
        {pinned.length > 0 && (
          <div>
            {!collapsed && (
              <p className="flex items-center gap-1.5 px-3 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
                <Star size={12} className="fill-amber-400 text-amber-400" /> Favoris
              </p>
            )}
            <div className="space-y-0.5">
              {pinned.map((item) => (
                <NavItem
                  key={`fav-${item.path}`}
                  item={item}
                  active={isActive(item.path)}
                  badge={badgeFor(item.path)}
                  collapsed={collapsed}
                  fav
                  onToggleFav={toggleFav}
                />
              ))}
            </div>
          </div>
        )}
        {groups.map(({ group, items }) => {
          const expanded = groupOpen(group);
          return (
            <div key={group}>
              {!collapsed && (
                <button
                  type="button"
                  onClick={() => toggleGroup(group)}
                  className="flex w-full items-center justify-between rounded-lg px-3 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wider text-ink-subtle transition-colors hover:text-ink"
                >
                  <span>{group}</span>
                  <ChevronDown size={14} className={cn('transition-transform', !expanded && '-rotate-90')} />
                </button>
              )}
              {expanded && (
                <div className="space-y-0.5">
                  {items.map((item) => (
                    <NavItem
                      key={item.path}
                      item={item}
                      active={isActive(item.path)}
                      badge={badgeFor(item.path)}
                      collapsed={collapsed}
                      fav={favSet.has(item.path)}
                      onToggleFav={toggleFav}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </>
  );
}

function NavItem({
  item,
  active,
  badge,
  collapsed,
  fav,
  onToggleFav,
}: {
  item: (typeof MODULES)[number];
  active: boolean;
  badge: number;
  collapsed: boolean;
  fav: boolean;
  onToggleFav: (path: string) => void;
}) {
  const Icon = item.icon;
  return (
    <div className="group/nav relative">
      <NavLink
        to={item.path}
        end={item.path === '/'}
        title={collapsed ? item.label : undefined}
        className={cn(
          'group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
          collapsed && 'justify-center px-0',
          active
            ? 'bg-brand-soft text-brand-soft-fg'
            : 'text-ink-muted hover:bg-surface-muted hover:text-ink',
        )}
      >
        {active && (
          <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-600" />
        )}
        <span className="relative">
          <Icon size={18} className={active ? '' : 'text-ink-subtle group-hover:text-ink'} />
          {badge > 0 && collapsed && (
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-brand-600 ring-2 ring-surface" />
          )}
        </span>
        {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
        {!collapsed && badge > 0 && (
          <span className="mr-5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-600 px-1.5 text-[11px] font-semibold text-white">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </NavLink>
      {!collapsed && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFav(item.path);
          }}
          title={fav ? 'Retirer des favoris' : 'Épingler aux favoris'}
          className={cn(
            'absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1 transition',
            fav
              ? 'text-amber-400 opacity-100'
              : 'text-ink-subtle opacity-0 hover:text-amber-400 group-hover/nav:opacity-100',
          )}
        >
          <Star size={13} className={fav ? 'fill-amber-400' : ''} />
        </button>
      )}
    </div>
  );
}

function SidebarFooter({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <div className="space-y-1 border-t border-surface-border p-3">
      <div
        className={cn(
          'flex items-center gap-2.5 rounded-xl bg-surface-muted px-3 py-2',
          collapsed && 'justify-center px-0',
        )}
        title={collapsed ? ORG_NAME : undefined}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-soft-fg">
          <Building2 size={15} />
        </span>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{ORG_NAME}</p>
            <p className="text-[11px] text-ink-subtle">Organisation</p>
          </div>
        )}
      </div>
      <button
        onClick={onToggle}
        className={cn(
          'flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink',
          collapsed && 'justify-center px-0',
        )}
        title={collapsed ? 'Déplier' : 'Replier'}
      >
        {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        {!collapsed && 'Replier'}
      </button>
    </div>
  );
}

function UserMenu({
  name,
  email,
  avatarSrc,
  canSettings,
  onLogout,
}: {
  name: string;
  email: string;
  avatarSrc?: string;
  canSettings: boolean;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl py-1 pl-1 pr-2 transition-colors hover:bg-surface-muted"
      >
        <Avatar name={name} src={avatarSrc} size="sm" />
        <span className="hidden text-sm font-medium text-ink sm:block">{name}</span>
        <ChevronDown size={15} className="hidden text-ink-subtle sm:block" />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-60 origin-top-right animate-slide-up overflow-hidden rounded-2xl border border-surface-border bg-surface-elevated shadow-pop">
          <div className="border-b border-surface-border px-4 py-3">
            <div className="flex items-center gap-3">
              <Avatar name={name} src={avatarSrc} size="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{name}</p>
                <p className="truncate text-xs text-ink-subtle">{email}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-surface-muted px-2.5 py-1.5">
              <Building2 size={14} className="text-ink-subtle" />
              <span className="truncate text-xs font-medium text-ink-muted">{ORG_NAME}</span>
            </div>
          </div>
          <div className="p-1.5">
            {canSettings && (
              <Link
                to="/parametres"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
              >
                <Settings size={16} /> Paramètres
              </Link>
            )}
            <Link
              to="/guide"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
            >
              <LifeBuoy size={16} /> Aide & guide
            </Link>
            <div className="my-1 h-px bg-surface-border" />
            <button
              onClick={onLogout}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-surface-muted hover:text-danger"
            >
              <LogOut size={16} /> Se déconnecter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
