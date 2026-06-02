import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarOff, Check, Clock, LogIn, LogOut, Plus, X } from 'lucide-react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  SkeletonRows,
  cn,
} from '@drwindesk/ui';
import { useEmployeLookup } from '@/features/rh/hooks';
import { fullName } from '@/features/rh/helpers';
import { useConges, usePointagesDuJour, usePointer, useSetStatutConge } from './hooks';
import { STATUT_CONGE_LABEL, TYPE_CONGE_LABEL, nbJours, type StatutConge } from './types';

type Tab = 'pointage' | 'conges';

const STATUT_TONE: Record<StatutConge, 'success' | 'warning' | 'danger'> = {
  APPROUVE: 'success',
  EN_ATTENTE: 'warning',
  REFUSE: 'danger',
};

function fmt(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

function Person({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Avatar name={name} size="sm" />
      <span className="font-medium text-ink">{name}</span>
    </div>
  );
}

export function PresencesPage() {
  const [tab, setTab] = useState<Tab>('pointage');

  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-ink">Présences & Congés</h2>
        <p className="text-ink-muted">Pointage du jour et gestion des demandes de congés.</p>
      </header>

      <div className="flex w-full max-w-md gap-1 rounded-xl bg-surface-muted p-1">
        {(
          [
            ['pointage', 'Pointage du jour'],
            ['conges', 'Congés'],
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

      {tab === 'pointage' ? <PointagePanel /> : <CongesPanel />}
    </div>
  );
}

function PointagePanel() {
  const { byId } = useEmployeLookup();
  const { data: pointages, isLoading } = usePointagesDuJour();
  const pointer = usePointer();

  return (
    <Card className="overflow-hidden p-0">
      {isLoading ? (
        <SkeletonRows rows={4} cols={4} />
      ) : !pointages || pointages.length === 0 ? (
        <EmptyState
          icon={<Clock size={20} />}
          title="Aucun pointage aujourd’hui"
          description="Les entrées et sorties du jour apparaîtront ici."
        />
      ) : (
        <table className="w-full text-sm">
          <thead className="border-b border-surface-border bg-surface-muted text-left text-xs uppercase tracking-wide text-ink-subtle">
            <tr>
              <th className="px-5 py-2.5 font-medium">Collaborateur</th>
              <th className="px-5 py-2.5 font-medium">Entrée</th>
              <th className="px-5 py-2.5 font-medium">Sortie</th>
              <th className="px-5 py-2.5 text-right font-medium">Pointer</th>
            </tr>
          </thead>
          <tbody>
            {pointages.map((p) => {
              const emp = byId.get(p.employeId);
              return (
                <tr key={p.id} className="border-b border-surface-border last:border-0">
                  <td className="px-5 py-3">
                    <Person name={emp ? fullName(emp) : p.employeId} />
                  </td>
                  <td className="px-5 py-3 tabular-nums text-ink-muted">{p.heureEntree ?? '—'}</td>
                  <td className="px-5 py-3 tabular-nums text-ink-muted">{p.heureSortie ?? '—'}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={pointer.isPending || Boolean(p.heureEntree)}
                        onClick={() => pointer.mutate({ employeId: p.employeId, sens: 'ENTREE' })}
                      >
                        <LogIn size={15} /> Entrée
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={pointer.isPending || !p.heureEntree || Boolean(p.heureSortie)}
                        onClick={() => pointer.mutate({ employeId: p.employeId, sens: 'SORTIE' })}
                      >
                        <LogOut size={15} /> Sortie
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </Card>
  );
}

function CongesPanel() {
  const { byId } = useEmployeLookup();
  const { data: conges, isLoading } = useConges();
  const setStatut = useSetStatutConge();

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link to="/presences/conges/nouveau">
          <Button>
            <Plus size={18} /> Nouvelle demande
          </Button>
        </Link>
      </div>

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <SkeletonRows rows={4} cols={5} />
        ) : !conges || conges.length === 0 ? (
          <EmptyState
            icon={<CalendarOff size={20} />}
            title="Aucune demande de congé"
            description="Les demandes de congés à traiter apparaîtront ici."
            action={
              <Link to="/presences/conges/nouveau">
                <Button size="sm">
                  <Plus size={16} /> Nouvelle demande
                </Button>
              </Link>
            }
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-surface-border bg-surface-muted text-left text-xs uppercase tracking-wide text-ink-subtle">
              <tr>
                <th className="px-5 py-2.5 font-medium">Collaborateur</th>
                <th className="hidden px-5 py-2.5 font-medium sm:table-cell">Type</th>
                <th className="px-5 py-2.5 font-medium">Période</th>
                <th className="hidden px-5 py-2.5 font-medium sm:table-cell">Jours</th>
                <th className="px-5 py-2.5 font-medium">Statut</th>
                <th className="px-5 py-2.5 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {conges.map((c) => {
                const emp = byId.get(c.employeId);
                return (
                  <tr key={c.id} className="border-b border-surface-border last:border-0">
                    <td className="px-5 py-3">
                      <Person name={emp ? fullName(emp) : c.employeId} />
                    </td>
                    <td className="hidden px-5 py-3 text-ink-muted sm:table-cell">
                      {TYPE_CONGE_LABEL[c.type]}
                    </td>
                    <td className="px-5 py-3 text-ink-muted">
                      {fmt(c.dateDebut)} → {fmt(c.dateFin)}
                    </td>
                    <td className="hidden px-5 py-3 tabular-nums text-ink-muted sm:table-cell">
                      {nbJours(c.dateDebut, c.dateFin)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={STATUT_TONE[c.statut]} dot>
                        {STATUT_CONGE_LABEL[c.statut]}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      {c.statut === 'EN_ATTENTE' ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={setStatut.isPending}
                            onClick={() => setStatut.mutate({ id: c.id, statut: 'APPROUVE' })}
                          >
                            <Check size={15} /> Approuver
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={setStatut.isPending}
                            onClick={() => setStatut.mutate({ id: c.id, statut: 'REFUSE' })}
                          >
                            <X size={15} /> Refuser
                          </Button>
                        </div>
                      ) : (
                        <div className="text-right text-xs text-ink-subtle">—</div>
                      )}
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
