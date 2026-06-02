import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { ChevronDown, LogOut } from 'lucide-react';
import { Avatar, cn } from '@drwindesk/ui';
import { MODULES } from '@/config/modules';
import { displayName, hasPermission, useAuth } from '@/auth/AuthContext';
import { NotificationBell } from '@/features/espaces/NotificationBell';
import { ThemeToggle } from '@/theme/ThemeToggle';

export function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const modules = MODULES.filter((m) => !m.requires || hasPermission(user, m.requires));
  const current = [...modules]
    .sort((a, b) => b.path.length - a.path.length)
    .find((m) =>
      m.path === '/' ? location.pathname === '/' : location.pathname.startsWith(m.path),
    );

  return (
    <div className="flex min-h-screen bg-surface-muted text-ink">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-surface-border bg-surface lg:flex">
        <div className="flex h-16 items-center gap-2 px-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            D
          </span>
          <span className="text-lg font-semibold tracking-tight">
            Drwin<span className="text-brand-600">Desk</span>
          </span>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
          <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
            Navigation
          </p>
          {modules.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-soft text-brand-soft-fg'
                    : 'text-ink-muted hover:bg-surface-muted hover:text-ink',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={18}
                    className={cn(isActive ? '' : 'text-ink-subtle group-hover:text-ink')}
                  />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-surface-border p-3">
          <div className="rounded-xl bg-surface-muted px-3 py-2 text-xs text-ink-subtle">
            Organisation Drwintech
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-surface-border bg-surface/80 px-4 backdrop-blur sm:px-6">
          <h1 className="min-w-0 truncate text-sm font-semibold text-ink">
            {current?.label ?? 'DrwinDesk'}
          </h1>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <NotificationBell />
            <div className="mx-1 h-6 w-px bg-surface-border" />
            <UserMenu
              name={user ? displayName(user) : 'Collaborateur'}
              email={user?.email ?? ''}
              onLogout={logout}
            />
          </div>
        </header>

        <main className="flex-1">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function UserMenu({ name, email, onLogout }: { name: string; email: string; onLogout: () => void }) {
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
        <Avatar name={name} size="sm" />
        <span className="hidden text-sm font-medium text-ink sm:block">{name}</span>
        <ChevronDown size={15} className="text-ink-subtle" />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-60 origin-top-right animate-slide-up overflow-hidden rounded-2xl border border-surface-border bg-surface-elevated shadow-pop">
          <div className="flex items-center gap-3 border-b border-surface-border px-4 py-3">
            <Avatar name={name} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{name}</p>
              <p className="truncate text-xs text-ink-subtle">{email}</p>
            </div>
          </div>
          <div className="p-1.5">
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
