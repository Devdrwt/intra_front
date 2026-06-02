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
  Select,
  SkeletonRows,
} from '@drwindesk/ui';
import { DEPARTEMENTS } from './mock';
import { STATUT_OPTIONS, type EmployeFilters } from './types';
import { useEmployes } from './hooks';
import { fullName, statutLabel, statutTone, formatDate } from './helpers';

export function EmployesListPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<EmployeFilters>({ search: '', departement: '', statut: '' });
  const { data: employes, isLoading, isError } = useEmployes(filters);
  const count = employes?.length ?? 0;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-ink">RH & Personnel</h2>
          <p className="text-ink-muted">Référentiel des collaborateurs et prestataires.</p>
        </div>
        <Link to="/rh/nouveau">
          <Button>
            <Plus size={18} /> Nouvel employé
          </Button>
        </Link>
      </header>

      <Card className="p-3">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <Input
            leading={<Search size={16} />}
            placeholder="Rechercher (nom, matricule, poste…)"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          />
          <Select
            options={DEPARTEMENTS.map((d) => ({ value: d, label: d }))}
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

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <SkeletonRows rows={6} cols={5} />
        ) : isError ? (
          <EmptyState
            icon={<Users size={20} />}
            title="Erreur de chargement"
            description="Impossible de récupérer la liste. Réessayez."
          />
        ) : count === 0 ? (
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
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-surface-border px-5 py-2.5 text-xs text-ink-subtle">
              <span>
                {count} collaborateur{count > 1 ? 's' : ''}
              </span>
            </div>
            <table className="w-full text-sm">
              <thead className="border-b border-surface-border bg-surface-muted text-left text-xs uppercase tracking-wide text-ink-subtle">
                <tr>
                  <th className="px-5 py-2.5 font-medium">Collaborateur</th>
                  <th className="px-5 py-2.5 font-medium">Poste</th>
                  <th className="hidden px-5 py-2.5 font-medium md:table-cell">Département</th>
                  <th className="hidden px-5 py-2.5 font-medium lg:table-cell">Contrat</th>
                  <th className="hidden px-5 py-2.5 font-medium lg:table-cell">Embauche</th>
                  <th className="px-5 py-2.5 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {employes!.map((e) => (
                  <tr
                    key={e.id}
                    onClick={() => navigate(`/rh/${e.id}`)}
                    className="cursor-pointer border-b border-surface-border transition-colors last:border-0 hover:bg-surface-muted"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={fullName(e)} size="md" />
                        <div className="min-w-0">
                          <div className="truncate font-medium text-ink">{fullName(e)}</div>
                          <div className="text-xs text-ink-subtle">{e.matricule}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-ink-muted">{e.poste}</td>
                    <td className="hidden px-5 py-3 text-ink-muted md:table-cell">{e.departement}</td>
                    <td className="hidden px-5 py-3 text-ink-muted lg:table-cell">{e.typeContrat}</td>
                    <td className="hidden px-5 py-3 text-ink-muted lg:table-cell">
                      {formatDate(e.dateEmbauche)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={statutTone(e.statut)} dot>
                        {statutLabel(e.statut)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </Card>
    </div>
  );
}
