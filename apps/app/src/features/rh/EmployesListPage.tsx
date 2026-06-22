import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Users } from 'lucide-react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Select,
  SkeletonRows,
} from '@drwindesk/ui';
import { STATUT_OPTIONS, type EmployeFilters } from './types';
import { useEmployes } from './hooks';
import { useDepartmentNames } from '@/features/settings/hooks';
import { Stagger, StaggerItem } from '@/components/motion';
import { fullName, statutLabel, statutTone, formatDate } from './helpers';

export function EmployesListPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<EmployeFilters>({ search: '', departement: '', statut: '' });
  const { data: employes, isLoading, isError } = useEmployes(filters);
  const departments = useDepartmentNames();
  const count = employes?.length ?? 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="RH & Personnel"
        subtitle="Référentiel des collaborateurs et prestataires."
        actions={
          <Link to="/rh/nouveau">
            <Button>
              <Plus size={18} /> Nouvel employé
            </Button>
          </Link>
        }
      />

      <Card className="p-3">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <Input
            leading={<Search size={16} />}
            placeholder="Rechercher (nom, matricule, poste…)"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          />
          <Select
            options={departments.map((d) => ({ value: d, label: d }))}
            placeholder="Tous les départements"
            value={filters.departement}
            onChange={(e) => setFilters((f) => ({ ...f, departement: e.target.value }))}
          />
          <Select
            options={STATUT_OPTIONS}
            placeholder="Tous les statuts"
            value={filters.statut}
            onChange={(e) =>
              setFilters((f) => ({ ...f, statut: e.target.value as EmployeFilters['statut'] }))
            }
          />
        </div>
      </Card>

      {isLoading ? (
        <Card className="overflow-hidden p-0">
          <SkeletonRows rows={6} cols={5} />
        </Card>
      ) : isError ? (
        <Card>
          <EmptyState
            icon={<Users size={20} />}
            title="Erreur de chargement"
            description="Impossible de récupérer la liste. Réessayez."
          />
        </Card>
      ) : count === 0 ? (
        <Card>
          <EmptyState
            icon={<Users size={20} />}
            title="Aucun collaborateur"
            description="Aucun employé ne correspond à votre recherche."
            action={
              <Link to="/rh/nouveau">
                <Button size="sm">
                  <Plus size={16} /> Ajouter un employé
                </Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          <p className="px-1 text-xs text-ink-subtle">
            {count} collaborateur{count > 1 ? 's' : ''}
          </p>
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {employes!.map((e) => (
              <StaggerItem key={e.id} className="h-full">
                <Card
                  interactive
                  onClick={() => navigate(`/rh/${e.id}`)}
                  className="flex h-full flex-col gap-3"
                >
                  <div className="flex items-start gap-3">
                    <Avatar name={fullName(e)} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-ink">{fullName(e)}</div>
                      <div className="truncate text-xs text-ink-subtle">{e.email}</div>
                    </div>
                    <Badge tone={statutTone(e.statut)} dot>
                      {statutLabel(e.statut)}
                    </Badge>
                  </div>
                  <div className="mt-auto space-y-0.5">
                    <p className="truncate text-sm text-ink-muted">
                      {e.poste}
                      {e.departement ? ` · ${e.departement}` : ''}
                    </p>
                    <p className="text-xs text-ink-subtle">
                      {e.typeContrat} · depuis {formatDate(e.dateEmbauche)}
                    </p>
                  </div>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      )}
    </div>
  );
}
