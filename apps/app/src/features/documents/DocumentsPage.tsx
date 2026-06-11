import { useState } from 'react';
import { FolderArchive, Search } from 'lucide-react';
import { Avatar, Card, EmptyState, Input, PageHeader, Skeleton, cn } from '@drwindesk/ui';
import { useEmployes } from '@/features/rh/hooks';
import { fullName } from '@/features/rh/helpers';
import { EmployeDocuments } from './EmployeDocuments';

/**
 * GED globale : on choisit un collaborateur à gauche, on gère ses documents à droite.
 * S'appuie sur les endpoints réels (RH + documents par employé).
 */
export function DocumentsPage() {
  const [search, setSearch] = useState('');
  const { data: employes, isLoading } = useEmployes({ search });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = employes?.find((e) => e.id === selectedId) ?? null;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Documents & Contrats"
        subtitle="Gestion électronique des documents (GED), par collaborateur."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Collaborateurs */}
        <Card className="p-0 lg:col-span-1">
          <div className="border-b border-surface-border p-3">
            <Input
              leading={<Search size={16} />}
              placeholder="Rechercher un collaborateur…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-[28rem] overflow-y-auto p-1.5">
            {isLoading ? (
              <div className="space-y-1 p-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-2 py-2">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-2/3" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !employes || employes.length === 0 ? (
              <EmptyState
                icon={<FolderArchive size={20} />}
                title="Aucun collaborateur"
                description="Ajoutez des employés depuis le module RH."
                className="py-10"
              />
            ) : (
              employes.map((e) => (
                <button
                  key={e.id}
                  onClick={() => setSelectedId(e.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors',
                    selectedId === e.id
                      ? 'bg-brand-soft text-brand-soft-fg'
                      : 'hover:bg-surface-muted',
                  )}
                >
                  <Avatar name={fullName(e)} size="sm" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-ink">{fullName(e)}</div>
                    <div className="truncate text-xs text-ink-subtle">
                      {e.poste} · {e.departement}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </Card>

        {/* Documents du collaborateur */}
        <Card className="lg:col-span-2">
          {selected ? (
            <>
              <div className="mb-4 flex items-center gap-3 border-b border-surface-border pb-4">
                <Avatar name={fullName(selected)} size="lg" />
                <div>
                  <h3 className="text-lg font-semibold text-ink">{fullName(selected)}</h3>
                  <p className="text-sm text-ink-muted">
                    {selected.poste} · {selected.departement}
                  </p>
                </div>
              </div>
              <EmployeDocuments employeId={selected.id} />
            </>
          ) : (
            <EmptyState
              icon={<FolderArchive size={22} />}
              title="Sélectionnez un collaborateur"
              description="Choisissez une personne à gauche pour consulter et gérer ses contrats, bulletins et pièces."
              className="py-20"
            />
          )}
        </Card>
      </div>
    </div>
  );
}
