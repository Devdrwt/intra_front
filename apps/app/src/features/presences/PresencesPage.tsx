import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarOff, Check, Clock, LogIn, LogOut, Plane, Plus, Trash2, X } from 'lucide-react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Select,
  SkeletonRows,
  cn,
} from '@drwindesk/ui';
import { useEmployeLookup, useEmployes } from '@/features/rh/hooks';
import { fullName } from '@/features/rh/helpers';
import { useOrgSettings } from '@/features/settings/org';
import {
  useCancelConge,
  useConges,
  useCreateMission,
  useMissions,
  usePointagesDuJour,
  usePointer,
  useRemoveMission,
  useSetStatutConge,
  useSuivi,
} from './hooks';
import {
  type SuiviPointage,
  CATEGORIE_LABEL,
  STATUT_CONGE_LABEL,
  TYPE_CONGE_LABEL,
  nbJours,
  type CategorieDemande,
  type StatutConge,
} from './types';

type Tab = 'pointage' | 'conges' | 'missions' | 'suivi';

const STATUT_TONE: Record<StatutConge, 'success' | 'warning' | 'danger'> = {
  APPROUVE: 'success',
  EN_ATTENTE: 'warning',
  REFUSE: 'danger',
};

const CATEGORIE_TONE: Record<CategorieDemande, 'brand' | 'neutral' | 'success'> = {
  PERMISSION: 'brand',
  REPOS: 'neutral',
  CONGE: 'success',
};

const CAT_FILTERS: [CategorieDemande | 'ALL', string][] = [
  ['ALL', 'Toutes'],
  ['PERMISSION', 'Permissions'],
  ['REPOS', 'Repos'],
  ['CONGE', 'Congés'],
];

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
            ['conges', 'Demandes'],
            ['missions', 'Missions'],
            ['suivi', 'Suivi'],
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

      {tab === 'pointage' ? (
        <PointagePanel />
      ) : tab === 'conges' ? (
        <CongesPanel />
      ) : tab === 'missions' ? (
        <MissionsPanel />
      ) : (
        <SuiviPanel />
      )}
    </div>
  );
}

const toMin = (hhmm?: string): number | null => {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':');
  return Number(h ?? 0) * 60 + Number(m ?? 0);
};
const monthAgo = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
};

function SuiviPanel() {
  const { data: org } = useOrgSettings();
  const [from, setFrom] = useState(monthAgo());
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [anomaliesOnly, setAnomaliesOnly] = useState(false);
  const { data: rows, isLoading } = useSuivi(from, to);

  const debutMin = toMin(org?.horaires.debut) ?? 510; // 08:30
  const GRACE = 5;
  const isRetard = (r: SuiviPointage) => {
    if (r.enMission) return false;
    const e = toMin(r.heureEntree);
    return e != null && e > debutMin + GRACE;
  };

  const list = (rows ?? []).filter((r) => !anomaliesOnly || isRetard(r) || r.horsZone);

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-end gap-3">
        <Input type="date" label="Du" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" label="Au" value={to} onChange={(e) => setTo(e.target.value)} />
        <label className="flex items-center gap-2 pb-2 text-sm text-ink">
          <input type="checkbox" checked={anomaliesOnly} onChange={(e) => setAnomaliesOnly(e.target.checked)} />
          Anomalies seulement (retard / hors zone)
        </label>
      </Card>

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <SkeletonRows rows={5} cols={5} />
        ) : list.length === 0 ? (
          <EmptyState icon={<Clock size={20} />} title="Aucun pointage" description="Aucun pointage sur cette période." />
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-surface-border bg-surface-muted text-left text-xs uppercase tracking-wide text-ink-subtle">
              <tr>
                <th className="px-5 py-2.5 font-medium">Date</th>
                <th className="px-5 py-2.5 font-medium">Collaborateur</th>
                <th className="px-5 py-2.5 font-medium">Entrée</th>
                <th className="hidden px-5 py-2.5 font-medium sm:table-cell">Sortie</th>
                <th className="px-5 py-2.5 text-right font-medium">Signalements</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => {
                const retard = isRetard(r);
                return (
                  <tr key={r.id} className="border-b border-surface-border last:border-0">
                    <td className="px-5 py-3 text-ink-muted">{fmt(r.date)}</td>
                    <td className="px-5 py-3 font-medium text-ink">{r.employeNom || r.employeId}</td>
                    <td className="px-5 py-3 tabular-nums text-ink-muted">{r.heureEntree ?? '—'}</td>
                    <td className="hidden px-5 py-3 tabular-nums text-ink-muted sm:table-cell">{r.heureSortie ?? '—'}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {r.enMission && <Badge tone="brand">Mission</Badge>}
                        {retard && <Badge tone="warning" dot>En retard</Badge>}
                        {r.horsZone && <Badge tone="danger" dot>Hors zone</Badge>}
                        {!retard && !r.horsZone && !r.enMission && <span className="text-xs text-ink-subtle">—</span>}
                      </div>
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

function MissionsPanel() {
  const { byId } = useEmployeLookup();
  const { data: employes } = useEmployes({});
  const { data: missions, isLoading } = useMissions();
  const createMission = useCreateMission();
  const removeMission = useRemoveMission();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ employeId: '', objet: '', lieu: '', dateDebut: '', dateFin: '' });

  const submit = async () => {
    if (!form.employeId || !form.objet || !form.dateDebut || !form.dateFin) return;
    await createMission.mutateAsync({
      employeId: form.employeId,
      objet: form.objet,
      lieu: form.lieu || undefined,
      dateDebut: form.dateDebut,
      dateFin: form.dateFin,
    });
    setForm({ employeId: '', objet: '', lieu: '', dateDebut: '', dateFin: '' });
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">
          Pendant une mission : présence présumée, pas d’alerte d’oubli, géofencing désactivé.
        </p>
        <Button onClick={() => setOpen((v) => !v)}>
          <Plus size={18} /> Nouvelle mission
        </Button>
      </div>

      {open && (
        <Card className="space-y-3">
          <Select
            label="Collaborateur *"
            placeholder="Sélectionner…"
            options={(employes ?? []).map((e) => ({ value: e.id, label: fullName(e) }))}
            value={form.employeId}
            onChange={(e) => setForm((f) => ({ ...f, employeId: e.target.value }))}
          />
          <Input label="Objet *" value={form.objet} onChange={(e) => setForm((f) => ({ ...f, objet: e.target.value }))} />
          <Input label="Lieu" value={form.lieu} onChange={(e) => setForm((f) => ({ ...f, lieu: e.target.value }))} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input type="date" label="Du *" value={form.dateDebut} onChange={(e) => setForm((f) => ({ ...f, dateDebut: e.target.value }))} />
            <Input type="date" label="Au *" value={form.dateFin} onChange={(e) => setForm((f) => ({ ...f, dateFin: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={() => void submit()} loading={createMission.isPending}>Enregistrer</Button>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <SkeletonRows rows={3} cols={4} />
        ) : !missions || missions.length === 0 ? (
          <EmptyState icon={<Plane size={20} />} title="Aucune mission" description="Les périodes de mission apparaîtront ici." />
        ) : (
          <ul className="divide-y divide-surface-border">
            {missions.map((m) => {
              const emp = byId.get(m.employeId);
              return (
                <li key={m.id} className="flex items-center justify-between gap-4 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {emp ? fullName(emp) : m.employeId} — {m.objet}
                    </p>
                    <p className="truncate text-xs text-ink-subtle">
                      {fmt(m.dateDebut)} → {fmt(m.dateFin)}
                      {m.lieu ? ` · ${m.lieu}` : ''}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={removeMission.isPending}
                    onClick={() => removeMission.mutate(m.id)}
                  >
                    <Trash2 size={15} />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
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
  const cancel = useCancelConge();
  const [cat, setCat] = useState<CategorieDemande | 'ALL'>('ALL');

  const all = conges ?? [];
  const catOf = (c: (typeof all)[number]) => c.categorie ?? 'CONGE';
  const filtered = cat === 'ALL' ? all : all.filter((c) => catOf(c) === cat);
  const countOf = (k: CategorieDemande | 'ALL') =>
    k === 'ALL' ? all.length : all.filter((c) => catOf(c) === k).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Filtre par catégorie */}
        <div className="flex flex-wrap gap-1.5">
          {CAT_FILTERS.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setCat(key)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                cat === key
                  ? 'border-brand-500 bg-brand-soft text-brand-soft-fg'
                  : 'border-surface-border text-ink-muted hover:bg-surface-muted hover:text-ink',
              )}
            >
              {label}
              <span className="text-xs text-ink-subtle">{countOf(key)}</span>
            </button>
          ))}
        </div>
        <Link to="/presences/conges/nouveau">
          <Button>
            <Plus size={18} /> Nouvelle demande
          </Button>
        </Link>
      </div>

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <SkeletonRows rows={4} cols={5} />
        ) : filtered.length === 0 ? (
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
                <th className="px-5 py-2.5 font-medium">Catégorie</th>
                <th className="px-5 py-2.5 font-medium">Période</th>
                <th className="hidden px-5 py-2.5 font-medium sm:table-cell">Jours</th>
                <th className="px-5 py-2.5 font-medium">Statut</th>
                <th className="px-5 py-2.5 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const emp = byId.get(c.employeId);
                const categorie = catOf(c);
                return (
                  <tr key={c.id} className="border-b border-surface-border last:border-0">
                    <td className="px-5 py-3">
                      <Person name={emp ? fullName(emp) : c.employeId} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Badge tone={CATEGORIE_TONE[categorie]}>{CATEGORIE_LABEL[categorie]}</Badge>
                        {categorie === 'CONGE' && (
                          <span className="hidden text-xs text-ink-subtle sm:inline">
                            {TYPE_CONGE_LABEL[c.type]}
                          </span>
                        )}
                      </div>
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
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={cancel.isPending}
                            title="Annuler / supprimer la demande"
                            onClick={() => cancel.mutate(c.id)}
                          >
                            <Trash2 size={15} />
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
