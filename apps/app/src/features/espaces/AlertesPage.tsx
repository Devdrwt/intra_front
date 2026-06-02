import { useState } from 'react';
import { BellOff, Check } from 'lucide-react';
import { Badge, Button, Card, Spinner, cn } from '@drwindesk/ui';
import { useMarkAllRead, useMarkRead, useNotifications } from './hooks';
import { SEVERITY_LABEL } from './types';
import { severityTone, timeAgo } from './helpers';

export function AlertesPage() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { data: notifications, isLoading } = useNotifications(unreadOnly);
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Alertes</h1>
          <p className="text-ink-muted">Notifications de votre espace personnel.</p>
        </div>
        <Button variant="secondary" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
          <Check size={16} /> Tout marquer lu
        </Button>
      </header>

      <div className="mb-4 flex gap-1 rounded-xl bg-surface-muted p-1">
        {(
          [
            [false, 'Toutes'],
            [true, 'Non lues'],
          ] as [boolean, string][]
        ).map(([key, label]) => (
          <button
            key={String(key)}
            onClick={() => setUnreadOnly(key)}
            className={cn(
              'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              unreadOnly === key ? 'bg-surface text-ink shadow-card' : 'text-ink-muted hover:text-ink',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : !notifications || notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <BellOff className="text-ink-subtle" />
            <p className="text-ink-muted">Aucune notification.</p>
          </div>
        ) : (
          <ul className="divide-y divide-surface-border">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={cn('flex items-start gap-4 px-5 py-4', !n.read && 'bg-brand-50/40')}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink">{n.title}</span>
                    <Badge tone={severityTone(n.severity)}>{SEVERITY_LABEL[n.severity]}</Badge>
                    {!n.read && <span className="h-2 w-2 rounded-full bg-brand-500" />}
                  </div>
                  {n.body && <p className="mt-0.5 text-sm text-ink-muted">{n.body}</p>}
                  <p className="mt-1 text-xs text-ink-subtle">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.read && (
                  <Button size="sm" variant="ghost" onClick={() => markRead.mutate(n.id)}>
                    Marquer lu
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
