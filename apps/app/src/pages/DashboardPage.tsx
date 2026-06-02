import { Link } from 'react-router-dom';
import {
  Bell,
  CalendarClock,
  FileBarChart,
  FileSignature,
  Plus,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardTitle, EmptyState, Skeleton, cn } from '@drwindesk/ui';
import { displayName, hasPermission, useAuth } from '@/auth/AuthContext';
import { useEspaceMoi } from '@/features/espaces/hooks';
import { severityDot, timeAgo } from '@/features/espaces/helpers';

/** Salutation selon l'heure locale de connexion. */
function greeting(h: number = new Date().getHours()): { hello: string; emoji: string } {
  if (h >= 5 && h < 12) return { hello: 'Bonjour', emoji: '☀️' };
  if (h >= 12 && h < 18) return { hello: 'Bon après-midi', emoji: '🌤️' };
  if (h >= 18 && h < 22) return { hello: 'Bonsoir', emoji: '🌆' };
  return { hello: 'Bonne nuit', emoji: '🌙' };
}

type Tone = 'brand' | 'success' | 'warning' | 'danger';
const TONE: Record<Tone, string> = {
  brand: 'bg-brand-soft text-brand-soft-fg',
  success: 'bg-success-soft text-success-soft-fg',
  warning: 'bg-warning-soft text-warning-soft-fg',
  danger: 'bg-danger-soft text-danger-soft-fg',
};

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
  loading,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone: Tone;
  loading?: boolean;
}) {
  return (
    <Card className="flex items-center gap-4">
      <span className={cn('flex h-11 w-11 items-center justify-center rounded-xl', TONE[tone])}>
        <Icon size={20} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">{label}</p>
        {loading ? (
          <Skeleton className="mt-1.5 h-7 w-12" />
        ) : (
          <p className="text-2xl font-bold text-ink">{value}</p>
        )}
      </div>
    </Card>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const { data: espace, isLoading } = useEspaceMoi();
  const unread = espace?.notifications.unread ?? 0;
  const recent = espace?.notifications.recent ?? [];

  const actions = [
    { to: '/rapports/nouveau', label: 'Saisir un rapport', icon: FileBarChart, perm: undefined },
    { to: '/rh/nouveau', label: 'Nouvel employé', icon: Plus, perm: undefined },
    { to: '/presences/conges/nouveau', label: 'Demander un congé', icon: CalendarClock, perm: undefined },
    { to: '/utilisateurs', label: 'Inviter un membre', icon: UserPlus, perm: 'user:read' },
  ].filter((a) => !a.perm || hasPermission(user, a.perm));

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-ink">
          {greeting().hello} {user ? displayName(user).split(' ')[0] : ''} {greeting().emoji}
        </h2>
        <p className="text-ink-muted">Voici l’état de votre espace aujourd’hui.</p>
      </header>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Bell}
          label="Notifications non lues"
          value={unread}
          tone={unread > 0 ? 'warning' : 'success'}
          loading={isLoading}
        />
        <StatCard icon={FileSignature} label="Contrats à échéance" value="—" tone="danger" />
        <StatCard icon={FileBarChart} label="Rapports du jour" value="—" tone="brand" />
        <StatCard icon={CalendarClock} label="Congés en attente" value="—" tone="success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Notifications récentes */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <CardTitle>Notifications récentes</CardTitle>
            <Link to="/alertes" className="text-sm font-medium text-brand-600 hover:underline">
              Voir tout
            </Link>
          </div>

          {isLoading ? (
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-2 w-2 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-3 w-14" />
                </div>
              ))}
            </div>
          ) : recent.length === 0 ? (
            <EmptyState
              icon={<Bell size={20} />}
              title="Tout est à jour"
              description="Aucune notification pour le moment."
              className="py-10"
            />
          ) : (
            <ul className="mt-3 divide-y divide-surface-border">
              {recent.map((n) => (
                <li key={n.id} className="flex items-start gap-3 py-3">
                  <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', severityDot(n.severity))} />
                  <div className="min-w-0 flex-1">
                    <div
                      className={cn(
                        'truncate text-sm',
                        n.read ? 'text-ink-muted' : 'font-medium text-ink',
                      )}
                    >
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

        {/* Actions rapides */}
        <Card>
          <CardTitle>Actions rapides</CardTitle>
          <div className="mt-4 space-y-2">
            {actions.map((a) => (
              <Link
                key={a.to}
                to={a.to}
                className="flex items-center gap-3 rounded-xl border border-surface-border px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:border-brand-300 hover:bg-brand-soft"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-muted text-ink-muted">
                  <a.icon size={16} />
                </span>
                {a.label}
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
