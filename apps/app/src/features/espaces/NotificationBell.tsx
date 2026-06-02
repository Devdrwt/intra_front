import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check } from 'lucide-react';
import { Spinner, cn } from '@drwindesk/ui';
import { useMarkAllRead, useMarkRead, useNotifications, useUnreadCount } from './hooks';
import { severityDot, timeAgo } from './helpers';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: unread } = useUnreadCount();
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const count = unread?.count ?? 0;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl text-ink-muted hover:bg-surface-muted hover:text-ink"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-2xl border border-surface-border bg-surface shadow-card">
            <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
              <span className="text-sm font-semibold text-ink">Notifications</span>
              {count > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                  className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
                >
                  <Check size={13} /> Tout marquer lu
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : !notifications || notifications.length === 0 ? (
                <p className="py-8 text-center text-sm text-ink-subtle">Aucune notification.</p>
              ) : (
                notifications.slice(0, 6).map((n) => (
                  <button
                    key={n.id}
                    onClick={() => !n.read && markRead.mutate(n.id)}
                    className={cn(
                      'flex w-full gap-3 border-b border-surface-border px-4 py-3 text-left last:border-0 hover:bg-surface-muted',
                      !n.read && 'bg-brand-50/40',
                    )}
                  >
                    <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', severityDot(n.severity))} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">{n.title}</span>
                      {n.body && <span className="block truncate text-xs text-ink-muted">{n.body}</span>}
                      <span className="mt-0.5 block text-[11px] text-ink-subtle">{timeAgo(n.createdAt)}</span>
                    </span>
                  </button>
                ))
              )}
            </div>

            <Link
              to="/alertes"
              onClick={() => setOpen(false)}
              className="block border-t border-surface-border px-4 py-2.5 text-center text-sm font-medium text-brand-600 hover:bg-surface-muted"
            >
              Voir toutes les alertes
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
