import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, CalendarClock, Plus, Search } from 'lucide-react';
import { Avatar, Badge, Button, Card, EmptyState, Input, PageHeader, Select, Skeleton } from '@drwindesk/ui';
import { hasPermission, useAuth } from '@/auth/AuthContext';
import { Stagger, StaggerItem } from '@/components/motion';
import { useProjects } from './hooks';
import {
  STATUT_PROJET_LABEL,
  STATUT_PROJET_OPTIONS,
  STATUT_PROJET_TONE,
  echeanceInfo,
  type ProjectFilters,
  type StatutProjet,
} from './types';

export function ProjectsPage() {
  const { user } = useAuth();
  const canManage = hasPermission(user, 'project:manage');
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ProjectFilters>({ statut: '', q: '' });
  const { data: projects, isLoading } = useProjects(filters);

  const list = projects ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projets"
        subtitle="Portefeuille des projets : avancement, échéances, livrables."
        actions={
          canManage ? (
            <Link to="/projets/nouveau">
              <Button>
                <Plus size={18} /> Nouveau projet
              </Button>
            </Link>
          ) : undefined
        }
      />

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <Input
          leading={<Search size={15} />}
          placeholder="Rechercher (nom, client)…"
          value={filters.q}
          onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
        />
        <Select
          options={STATUT_PROJET_OPTIONS}
          placeholder="Tous les statuts"
          value={filters.statut}
          onChange={(e) => setFilters((f) => ({ ...f, statut: e.target.value as StatutProjet | '' }))}
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            icon={<Briefcase size={22} />}
            title="Aucun projet"
            description="Créez votre premier projet pour suivre son avancement."
            action={
              canManage ? (
                <Link to="/projets/nouveau">
                  <Button size="sm">
                    <Plus size={16} /> Nouveau projet
                  </Button>
                </Link>
              ) : undefined
            }
            className="py-14"
          />
        </Card>
      ) : (
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => {
            const ech = echeanceInfo(p.dateFin, p.statut);
            return (
              <StaggerItem key={p.id} className="h-full">
              <Card
                interactive
                onClick={() => navigate(`/projets/${p.id}`)}
                className="flex h-full flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="min-w-0 flex-1 truncate font-semibold text-ink">{p.nom}</h3>
                  <Badge tone={STATUT_PROJET_TONE[p.statut]} dot>
                    {STATUT_PROJET_LABEL[p.statut]}
                  </Badge>
                </div>

                {p.client && <p className="-mt-1 text-xs text-ink-subtle">{p.client}</p>}

                {/* Progression */}
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-ink-subtle">
                    <span>Avancement</span>
                    <span className="tabular-nums">{p.progression}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
                    <div className="h-full rounded-full bg-brand-600" style={{ width: `${p.progression}%` }} />
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                  {/* Équipe */}
                  <div className="flex -space-x-2">
                    {p.responsable && (
                      <Avatar name={`${p.responsable.prenom} ${p.responsable.nom}`} size="sm" />
                    )}
                    {p.membres.slice(0, 3).map((m) => (
                      <Avatar key={m.id} name={`${m.prenom} ${m.nom}`} size="sm" />
                    ))}
                    {p.membres.length > 3 && (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-surface-border bg-surface text-[10px] font-medium text-ink-subtle">
                        +{p.membres.length - 3}
                      </span>
                    )}
                  </div>
                  {ech && (
                    <span
                      className={
                        ech.tone === 'danger'
                          ? 'inline-flex items-center gap-1 text-xs font-medium text-danger'
                          : ech.tone === 'warning'
                            ? 'inline-flex items-center gap-1 text-xs font-medium text-warning'
                            : 'inline-flex items-center gap-1 text-xs text-ink-subtle'
                      }
                    >
                      <CalendarClock size={13} /> {ech.label}
                    </span>
                  )}
                </div>
              </Card>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}
    </div>
  );
}
