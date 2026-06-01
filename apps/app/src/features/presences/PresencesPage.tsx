import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, LogIn, LogOut, Plus, X } from 'lucide-react';
import { Badge, Button, Card, Spinner, cn } from '@drwindesk/ui';
import { useEmployeLookup } from '@/features/rh/hooks';
import { fullName } from '@/features/rh/helpers';
import { useConges, usePointagesDuJour, usePointer, useSetStatutConge } from './hooks';
import {
  STATUT_CONGE_LABEL,
  TYPE_CONGE_LABEL,
  nbJours,
  type StatutConge,
} from './types';

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

export function PresencesPage() {
  const [tab, setTab] = useState<Tab>('pointage');

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ink">Présences & Congés</h1>
        <p className="text-ink-muted">Pointage du jour et gestion des demandes de congés.</p>
      </header>

      <div className="mb-4 flex gap-1 rounded-xl bg-surface-muted p-1">
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

  if (isLoading) {
    return (
      <Card className="flex justify-center py-16">
        <Spinner />
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <table className="w-full text-sm">
        <thead className="border-b border-surface-border bg-surface-muted text-left text-xs uppercase text-ink-subtle">
          <tr>
            <th className="px-5 py-3 font-medium">Collaborateur</th>
            <th className="px-5 py-3 font-medium">Entrée</th>
            <th className="px-5 py-3 font-medium">Sortie</th>
            <th className="px-5 py-3 text-right font-medium">Pointer</th>
          </tr>
        </thead>
        <tbody>
          {(pointages ?? []).map((p) => {
            const emp = byId.get(p.employeId);
            return (
              <tr key={p.id} className="border-b border-surface-border last:border-0">
                <td className="px-5 py-3 font-medium text-ink">
                  {emp ? fullName(emp) : p.employeId}
                </td>
                <td className="px-5 py-3 text-ink-muted">{p.heureEntree ?? '—'}</td>
                <td className="px-5 py-3 text-ink-muted">{p.heureSortie ?? '—'}</td>
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
          {(!pointages || pointages.length === 0) && (
            <tr>
              <td colSpan={4} className="px-5 py-12 text-center text-ink-subtle">
                Aucun pointage aujourd’hui.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Card>
  );
}

function CongesPanel() {
  const { byId } = useEmployeLookup();
  const { data: conges, isLoading } = useConges();
  const setStatut = useSetStatutConge();

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Link to="/presences/conges/nouveau">
          <Button>
            <Plus size={18} /> Nouvelle demande
          </Button>
        </Link>
      </div>

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-surface-border bg-surface-muted text-left text-xs uppercase text-ink-subtle">
              <tr>
                <th className="px-5 py-3 font-medium">Collaborateur</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Période</th>
                <th className="px-5 py-3 font-medium">Jours</th>
                <th className="px-5 py-3 font-medium">Statut</th>
                <th className="px-5 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {(conges ?? []).map((c) => {
                const emp = byId.get(c.employeId);
                return (
                  <tr key={c.id} className="border-b border-surface-border last:border-0">
                    <td className="px-5 py-3 font-medium text-ink">
                      {emp ? fullName(emp) : c.employeId}
                    </td>
                    <td className="px-5 py-3 text-ink-muted">{TYPE_CONGE_LABEL[c.type]}</td>
                    <td className="px-5 py-3 text-ink-muted">
                      {fmt(c.dateDebut)} → {fmt(c.dateFin)}
                    </td>
                    <td className="px-5 py-3 text-ink-muted">{nbJours(c.dateDebut, c.dateFin)}</td>
                    <td className="px-5 py-3">
                      <Badge tone={STATUT_TONE[c.statut]}>{STATUT_CONGE_LABEL[c.statut]}</Badge>
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
              {(!conges || conges.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-ink-subtle">
                    Aucune demande de congé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
