import { useState } from 'react';
import { BellOff, Check } from 'lucide-react';
import { Badge, Button, Card, EmptyState, Skeleton, cn } from '@drwindesk/ui';
import { useMarkAllRead, useMarkRead, useNotifications } from './hooks';
import { SEVERITY_LABEL } from './types';
import { severityTone, timeAgo } from './helpers';

export function AlertesPage() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { data: notifications, isLoading } = useNotifications(unreadOnly);
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-ink">Alertes</h2>
          <p className="text-ink-muted">Notifications de votre espace personnel.</p>
        </div>
        <Button
          variant="secondary"
          onClick={() => markAllRead.mutate()}
          disabled={markAllRead.isPending}
        >
          <Check size={16} /> Tout marquer lu
        </Button>
      </header>

      <div className="flex w-full max-w-xs gap-1 rounded-xl bg-surface-muted p-1">
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
          <div className="divide-y divide-surface-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-4">
                <Skeleton className="h-2 w-2 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : !notifications || notifications.length === 0 ? (
          <EmptyState
            icon={<BellOff size={20} />}
            title="Aucune notification"
            description={unreadOnly ? 'Tout est lu. 🎉' : 'Vous n’avez aucune alerte pour le moment.'}
          />
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
