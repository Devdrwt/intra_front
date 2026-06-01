import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Users } from 'lucide-react';
import { Badge, Button, Card, Input, Select, Spinner } from '@drwindesk/ui';
import { DEPARTEMENTS } from './mock';
import { STATUT_OPTIONS, type EmployeFilters } from './types';
import { useEmployes } from './hooks';
import { fullName, initials, statutLabel, statutTone, formatDate } from './helpers';

export function EmployesListPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<EmployeFilters>({ search: '', departement: '', statut: '' });
  const { data: employes, isLoading, isError } = useEmployes(filters);

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">RH & Personnel</h1>
          <p className="text-ink-muted">Référentiel des collaborateurs et prestataires.</p>
        </div>
        <Link to="/rh/nouveau">
          <Button>
            <Plus size={18} /> Nouvel employé
          </Button>
        </Link>
      </header>

      <Card className="mb-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle"
            />
            <Input
              className="pl-9"
              placeholder="Rechercher (nom, matricule, poste…)"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            />
          </div>
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
          <div className="flex items-center justify-center py-16">
            <Spinner />
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-danger">Erreur de chargement.</div>
        ) : !employes || employes.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Users className="text-ink-subtle" />
            <p className="text-ink-muted">Aucun employé ne correspond.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-surface-border bg-surface-muted text-left text-xs uppercase text-ink-subtle">
              <tr>
                <th className="px-5 py-3 font-medium">Collaborateur</th>
                <th className="px-5 py-3 font-medium">Poste</th>
                <th className="px-5 py-3 font-medium">Département</th>
                <th className="px-5 py-3 font-medium">Contrat</th>
                <th className="px-5 py-3 font-medium">Embauche</th>
                <th className="px-5 py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {employes.map((e) => (
                <tr
                  key={e.id}
                  onClick={() => navigate(`/rh/${e.id}`)}
                  className="cursor-pointer border-b border-surface-border last:border-0 hover:bg-surface-muted"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                        {initials(e)}
                      </span>
                      <div>
                        <div className="font-medium text-ink">{fullName(e)}</div>
                        <div className="text-xs text-ink-subtle">{e.matricule}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-ink-muted">{e.poste}</td>
                  <td className="px-5 py-3 text-ink-muted">{e.departement}</td>
                  <td className="px-5 py-3 text-ink-muted">{e.typeContrat}</td>
                  <td className="px-5 py-3 text-ink-muted">{formatDate(e.dateEmbauche)}</td>
                  <td className="px-5 py-3">
                    <Badge tone={statutTone(e.statut)}>{statutLabel(e.statut)}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
