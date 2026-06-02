import { NavLink, Outlet } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { cn } from '@drwindesk/ui';
import { MODULES } from '@/config/modules';
import { displayName, hasPermission, useAuth } from '@/auth/AuthContext';
import { NotificationBell } from '@/features/espaces/NotificationBell';

export function AppLayout() {
  const { user, logout } = useAuth();
  // Masque les entrées dont la permission requise n'est pas détenue (le backend
  // reste l'autorité : les routes/API renvoient 403 si on force l'URL).
  const modules = MODULES.filter((m) => !m.requires || hasPermission(user, m.requires));

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 shrink-0 flex-col border-r border-surface-border bg-surface">
        <div className="px-5 py-5 text-lg font-semibold text-ink">
          Drwin<span className="text-brand-600">Desk</span>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {modules.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-ink-muted hover:bg-surface-muted hover:text-ink',
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-surface-border p-3">
          <div className="px-2 py-1.5">
            <p className="truncate text-sm font-medium text-ink">
              {user ? displayName(user) : 'Collaborateur'}
            </p>
            <p className="truncate text-xs text-ink-subtle">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="mt-1 flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm text-ink-muted hover:bg-surface-muted"
          >
            <LogOut size={16} /> Se déconnecter
          </button>
        </div>
      </aside>

      <main className="flex flex-1 flex-col overflow-y-auto">
        <header className="flex items-center justify-end border-b border-surface-border bg-surface px-6 py-3">
          <NotificationBell />
        </header>
        <div className="mx-auto w-full max-w-6xl px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
