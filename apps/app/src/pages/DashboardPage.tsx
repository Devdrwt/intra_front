import { Link } from 'react-router-dom';
import {
  Bell,
  CalendarClock,
  ClipboardCheck,
  Clock,
  FileBarChart,
  MessagesSquare,
  Plus,
  Users,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import { Badge, Button, Card, CardTitle, EmptyState, PageHeader, Skeleton, cn } from '@drwindesk/ui';
import { displayName, hasPermission, useAuth } from '@/auth/AuthContext';
import { Stagger, StaggerItem } from '@/components/motion';
import { useEspaceMoi } from '@/features/espaces/hooks';
import { severityDot, timeAgo } from '@/features/espaces/helpers';
import { useMePointer, useMyConges, useMyPointages, useMyProfile, useMyRapports } from '@/features/me/hooks';
import { useUnreadCount } from '@/features/discussion/hooks';
import { useApprovalInboxCount } from '@/features/approvals/hooks';
import { usePointagesDuJour } from '@/features/presences/hooks';
import { useEmployes } from '@/features/rh/hooks';
import { AgendaWidget } from '@/features/agenda/AgendaWidget';
import { AlaUneCard } from '@/features/actualites/AlaUneCard';
import { PresenceRepartitionCard } from '@/features/presences/PresenceRepartitionCard';
import { MesTachesWidget } from '@/features/tasks/MesTachesWidget';

function greeting(h: number = new Date().getHours()): { hello: string; emoji: string } {
  if (h >= 5 && h < 12) return { hello: 'Bonjour', emoji: '☀️' };
  if (h >= 12 && h < 18) return { hello: 'Bon après-midi', emoji: '🌤️' };
  if (h >= 18 && h < 22) return { hello: 'Bonsoir', emoji: '🌆' };
  return { hello: 'Bonne nuit', emoji: '🌙' };
}

const todayStr = () => new Date().toISOString().slice(0, 10);
const fullDate = () =>
  new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

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
  to,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone: Tone;
  loading?: boolean;
  to?: string;
}) {
  const inner = (
    <Card interactive={!!to} className="flex h-full items-center gap-4">
      <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', TONE[tone])}>
        <Icon size={20} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">{label}</p>
        {loading ? (
          <Skeleton className="mt-1.5 h-7 w-16" />
        ) : (
          <p className="truncate text-xl font-bold text-ink">{value}</p>
        )}
      </div>
    </Card>
  );
  return to ? (
    <Link to={to} className="block h-full">
      {inner}
    </Link>
  ) : (
    inner
  );
}

/** Bouton de pointage en 1 clic (entrée → sortie selon l'état du jour). */
function PointageQuick() {
  const { data: pointages } = useMyPointages();
  const pointer = useMePointer();
  const p = (pointages ?? []).find((x) => x.date === todayStr());
  if (p?.heureSortie) {
    return (
      <Badge tone="success" dot>
        Journée terminée
      </Badge>
    );
  }
  const sens = p?.heureEntree ? 'SORTIE' : 'ENTREE';
  return (
    <Button onClick={() => pointer.mutate(sens)} loading={pointer.isPending}>
      <Clock size={16} /> {p?.heureEntree ? 'Pointer la sortie' : 'Pointer l’entrée'}
    </Button>
  );
}

/** KPIs « à traiter » pour les managers/RH/admins. */
function AdminKpis() {
  const aValider = useApprovalInboxCount();
  const { data: pointages } = usePointagesDuJour();
  const { data: employes } = useEmployes({});
  const present = (pointages ?? []).filter((p) => p.heureEntree).length;
  const total = employes?.length ?? 0;
  return (
    <div>
      <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-subtle">À traiter</p>
      <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StaggerItem>
          <StatCard
            icon={ClipboardCheck}
            label="À valider"
            value={aValider}
            tone={aValider > 0 ? 'warning' : 'success'}
            to="/mes-validations"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            icon={Users}
            label="Présents aujourd’hui"
            value={total ? `${present}/${total}` : present}
            tone="brand"
            to="/presences"
          />
        </StaggerItem>
      </Stagger>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const { data: espace, isLoading } = useEspaceMoi();
  const { data: profile } = useMyProfile();
  const recent = espace?.notifications.recent ?? [];
  const firstName = profile?.firstName?.trim() || (user ? displayName(user).split(' ')[0] : '');
  const isManager = hasPermission(user, 'presence:manage');

  const rapports = useMyRapports();
  const conges = useMyConges();
  const pointages = useMyPointages();
  const { data: unreadMsg = 0 } = useUnreadCount();

  const today = todayStr();
  const todayP = (pointages.data ?? []).find((p) => p.date === today);
  const pointageValue = todayP?.heureSortie
    ? `Sortie ${todayP.heureSortie}`
    : todayP?.heureEntree
      ? `Entrée ${todayP.heureEntree}`
      : 'Non pointé';
  const todayR = (rapports.data ?? []).find((r) => r.date === today);
  const pendingDemandes = (conges.data ?? []).filter((c) => c.statut === 'EN_ATTENTE').length;

  const actions = [
    { to: '/mes-demandes', label: 'Faire une demande', icon: CalendarClock, perm: undefined },
    { to: '/mes-rapports', label: 'Saisir un rapport', icon: FileBarChart, perm: undefined },
    { to: '/rh/nouveau', label: 'Nouvel employé', icon: Plus, perm: 'rh.employe:read' },
    { to: '/utilisateurs', label: 'Inviter un membre', icon: UserPlus, perm: 'user:read' },
  ].filter((a) => !a.perm || hasPermission(user, a.perm));

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-surface-border bg-gradient-to-br from-brand-soft/60 via-surface to-surface p-5 shadow-soft">
        <PageHeader
          title={
            <span className="capitalize">
              {greeting().hello} {firstName} {greeting().emoji}
            </span>
          }
          subtitle={<span className="capitalize">{fullDate()}</span>}
          actions={<PointageQuick />}
        />
      </div>

      {/* Indicateurs self-service */}
      <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StaggerItem>
          <StatCard icon={Clock} label="Pointage du jour" value={pointageValue} tone={todayP?.heureEntree ? 'success' : 'warning'} loading={pointages.isLoading} to="/mon-pointage" />
        </StaggerItem>
        <StaggerItem>
          <StatCard icon={FileBarChart} label="Rapport du jour" value={todayR ? 'Remis' : 'À faire'} tone={todayR ? 'success' : 'warning'} loading={rapports.isLoading} to="/mes-rapports" />
        </StaggerItem>
        <StaggerItem>
          <StatCard icon={CalendarClock} label="Demandes en attente" value={pendingDemandes} tone={pendingDemandes > 0 ? 'warning' : 'success'} loading={conges.isLoading} to="/mes-demandes" />
        </StaggerItem>
        <StaggerItem>
          <StatCard icon={MessagesSquare} label="Messages non lus" value={unreadMsg} tone={unreadMsg > 0 ? 'brand' : 'success'} to="/discussion" />
        </StaggerItem>
      </Stagger>

      {isManager && <AdminKpis />}

      {/* Contenu vivant (gauche) + perso (droite) */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <AlaUneCard />
          <AgendaWidget />
        </div>

        <div className="space-y-6">
          {isManager && <PresenceRepartitionCard />}
          <MesTachesWidget />

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

          <Card>
            <div className="flex items-center justify-between">
              <CardTitle>Notifications</CardTitle>
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
                  </div>
                ))}
              </div>
            ) : recent.length === 0 ? (
              <EmptyState icon={<Bell size={20} />} title="Tout est à jour" className="py-8" />
            ) : (
              <ul className="mt-3 divide-y divide-surface-border">
                {recent.slice(0, 5).map((n) => (
                  <li key={n.id} className="flex items-start gap-3 py-2.5">
                    <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', severityDot(n.severity))} />
                    <div className="min-w-0 flex-1">
                      <div className={cn('truncate text-sm', n.read ? 'text-ink-muted' : 'font-medium text-ink')}>
                        {n.title}
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-ink-subtle">{timeAgo(n.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
