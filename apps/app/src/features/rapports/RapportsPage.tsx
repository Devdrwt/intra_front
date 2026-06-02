import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BellRing, FileBarChart, Plus } from 'lucide-react';
import { Badge, Button, Callout, Card, Input, Select, Spinner, cn } from '@drwindesk/ui';
import { useAuth } from '@/auth/AuthContext';
import { useEmployeLookup } from '@/features/rh/hooks';
import { fullName } from '@/features/rh/helpers';
import { useCheckMissing, useConsolidation, useRapports } from './hooks';
import {
  STATUT_RAPPORT_LABEL,
  STATUT_RAPPORT_OPTIONS,
  type ConsolidationQuery,
  type GroupBy,
  type RapportFilters,
} from './types';

type Tab = 'rapports' | 'consolidation';
const today = () => new Date().toISOString().slice(0, 10);

export function RapportsPage() {
  const [tab, setTab] = useState<Tab>('rapports');
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ink">Rapports</h1>
        <p className="text-ink-muted">
          Rapport journalier par collaborateur, consolidé par service et département.
        </p>
      </header>

      <div className="mb-4 flex gap-1 rounded-xl bg-surface-muted p-1">
        {(
          [
            ['rapports', 'Rapports'],
            ['consolidation', 'Consolidation'],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              tab === key ? 'bg-surface text-ink shadow-card' : 'text-ink-muted hover:text-ink',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'rapports' ? <RapportsPanel /> : <ConsolidationPanel />}
    </div>
  );
}

function RapportsPanel() {
  const { user } = useAuth();
  const canManage = Boolean(
    user?.permissions.includes('*') || user?.permissions.includes('rapport:manage'),
  );
  const { byId } = useEmployeLookup();
  const [filters, setFilters] = useState<RapportFilters>({ date: '', employeId: '', statut: '' });
  const { data: rapports, isLoading } = useRapports(filters);
  const checkMissing = useCheckMissing();
  const [missingMsg, setMissingMsg] = useState<string | null>(null);

  const runCheck = async () => {
    setMissingMsg(null);
    const res = await checkMissing.mutateAsync(filters.date || undefined);
    setMissingMsg(
      `${res.manquants} rapport(s) non remis pour le ${res.date}${
        res.manquants > 0 ? ' — alertes envoyées.' : '.'
      }`,
    );
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="grid flex-1 gap-3 sm:grid-cols-[auto_1fr_auto]">
          <Input
            type="date"
            value={filters.date}
            onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value }))}
          />
          <Select
            options={(byId.size ? [...byId.values()] : []).map((e) => ({
              value: e.id,
              label: fullName(e),
            }))}
            placeholder="Tous les collaborateurs"
            value={filters.employeId}
            onChange={(e) => setFilters((f) => ({ ...f, employeId: e.target.value }))}
          />
          <Select
            options={STATUT_RAPPORT_OPTIONS}
            placeholder="Tous les statuts"
            value={filters.statut}
            onChange={(e) =>
              setFilters((f) => ({ ...f, statut: e.target.value as RapportFilters['statut'] }))
            }
          />
        </div>
        <div className="flex gap-2">
          {canManage && (
            <Button variant="secondary" onClick={runCheck} disabled={checkMissing.isPending}>
              <BellRing size={16} /> Non remis
            </Button>
          )}
          <Link to="/rapports/nouveau">
            <Button>
              <Plus size={18} /> Saisir
            </Button>
          </Link>
        </div>
      </div>

      {missingMsg && (
        <Callout tone="warning" className="mb-4">
          {missingMsg}
        </Callout>
      )}

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : !rapports || rapports.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <FileBarChart className="text-ink-subtle" />
            <p className="text-ink-muted">Aucun rapport.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-surface-border bg-surface-muted text-left text-xs uppercase text-ink-subtle">
              <tr>
                <th className="px-5 py-3 font-medium">Collaborateur</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Extrait</th>
                <th className="px-5 py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {rapports.map((r) => {
                const emp = byId.get(r.employeId);
                return (
                  <tr key={r.id} className="border-b border-surface-border last:border-0">
                    <td className="px-5 py-3 font-medium text-ink">
                      {emp ? fullName(emp) : r.employeId}
                    </td>
                    <td className="px-5 py-3 text-ink-muted">{r.date}</td>
                    <td className="max-w-md truncate px-5 py-3 text-ink-muted">{r.contenu}</td>
                    <td className="px-5 py-3">
                      <Badge tone={r.statut === 'SOUMIS' ? 'success' : 'warning'}>
                        {STATUT_RAPPORT_LABEL[r.statut]}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function tauxTone(taux: number): 'success' | 'warning' | 'danger' {
  if (taux >= 0.8) return 'success';
  if (taux >= 0.5) return 'warning';
  return 'danger';
}

function ConsolidationPanel() {
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());
  const [groupBy, setGroupBy] = useState<GroupBy>('service');
  const query: ConsolidationQuery = { from, to, groupBy };
  const { data: lignes, isLoading, isError } = useConsolidation(query, Boolean(from && to));

  return (
    <div>
      <Card className="mb-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr]">
          <Input type="date" label="Du" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input type="date" label="Au" value={to} onChange={(e) => setTo(e.target.value)} />
          <Select
            label="Regrouper par"
            options={[
              { value: 'service', label: 'Service (hebdo)' },
              { value: 'departement', label: 'Département (mensuel)' },
            ]}
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupBy)}
          />
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-danger">Erreur de chargement.</div>
        ) : !lignes || lignes.length === 0 ? (
          <div className="py-16 text-center text-ink-muted">Aucune donnée sur la période.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-surface-border bg-surface-muted text-left text-xs uppercase text-ink-subtle">
              <tr>
                <th className="px-5 py-3 font-medium">
                  {groupBy === 'service' ? 'Service' : 'Département'}
                </th>
                <th className="px-5 py-3 font-medium">Actifs</th>
                <th className="px-5 py-3 font-medium">Soumis</th>
                <th className="px-5 py-3 font-medium">Jours</th>
                <th className="px-5 py-3 font-medium">Taux</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((l) => (
                <tr key={l.groupe} className="border-b border-surface-border last:border-0">
                  <td className="px-5 py-3 font-medium text-ink">{l.groupe}</td>
                  <td className="px-5 py-3 text-ink-muted">{l.employesActifs}</td>
                  <td className="px-5 py-3 text-ink-muted">{l.rapportsSoumis}</td>
                  <td className="px-5 py-3 text-ink-muted">{l.joursPeriode}</td>
                  <td className="px-5 py-3">
                    <Badge tone={tauxTone(l.taux)}>{Math.round(l.taux * 100)}%</Badge>
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
