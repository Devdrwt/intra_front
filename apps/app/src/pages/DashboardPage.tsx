import { Link } from 'react-router-dom';
import { Badge, Card, CardTitle, CardDescription, Spinner, cn } from '@drwindesk/ui';
import { displayName, useAuth } from '@/auth/AuthContext';
import { useEspaceMoi } from '@/features/espaces/hooks';
import { severityDot, timeAgo } from '@/features/espaces/helpers';

export function DashboardPage() {
  const { user } = useAuth();
  const { data: espace, isLoading } = useEspaceMoi();
  const unread = espace?.notifications.unread ?? 0;
  const recent = espace?.notifications.recent ?? [];

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ink">
          Bonjour {user ? displayName(user).split(' ')[0] : ''} 👋
        </h1>
        <p className="text-ink-muted">Voici l’état de votre espace aujourd’hui.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <Badge tone={unread > 0 ? 'warning' : 'success'}>Notifications non lues</Badge>
          <p className="mt-3 text-3xl font-bold text-ink">{isLoading ? '…' : unread}</p>
        </Card>
        {[
          { label: 'Contrats à échéance (30j)', tone: 'neutral' as const },
          { label: 'Rapports du jour remis', tone: 'neutral' as const },
          { label: 'Congés en attente', tone: 'neutral' as const },
        ].map((s) => (
          <Card key={s.label}>
            <Badge tone={s.tone}>{s.label}</Badge>
            <p className="mt-3 text-3xl font-bold text-ink">—</p>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <div className="flex items-center justify-between">
          <CardTitle>Notifications récentes</CardTitle>
          <Link to="/alertes" className="text-sm text-brand-600 hover:underline">
            Voir tout
          </Link>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : recent.length === 0 ? (
          <CardDescription>Aucune notification pour le moment.</CardDescription>
        ) : (
          <ul className="mt-3 divide-y divide-surface-border">
            {recent.map((n) => (
              <li key={n.id} className="flex items-start gap-3 py-3">
                <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', severityDot(n.severity))} />
                <div className="min-w-0 flex-1">
                  <div className={cn('truncate text-sm', n.read ? 'text-ink-muted' : 'font-medium text-ink')}>
                    {n.title}
                  </div>
                  {n.body && <div className="truncate text-xs text-ink-subtle">{n.body}</div>}
                </div>
                <span className="shrink-0 text-xs text-ink-subtle">{timeAgo(n.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
