import { useMemo, useState } from 'react';
import { Clock, Coffee, Plane, Plus, X, type LucideIcon } from 'lucide-react';
import { Badge, Button, Callout, Card, CardTitle, EmptyState, Input, Modal, PageHeader, Select, Skeleton, cn } from '@drwindesk/ui';
import { apiErrorMessage } from '@/lib/api';
import { Stagger, StaggerItem } from '@/components/motion';
import {
  CATEGORIE_LABEL,
  JOURS_ORDER,
  JOUR_COURT,
  STATUT_CONGE_LABEL,
  TYPE_CONGE_LABEL,
  TYPE_CONGE_OPTIONS,
  dureeLabel,
  joursReposLabel,
  nbJours,
  type CategorieDemande,
  type JourSemaine,
  type StatutConge,
  type TypeConge,
} from '@/features/presences/types';
import { useCancelMyConge, useCreateMyConge, useMyConges } from './hooks';
import { MeNotLinked } from './MeNotLinked';

const STATUT_TONE: Record<StatutConge, 'success' | 'warning' | 'danger'> = {
  EN_ATTENTE: 'warning',
  APPROUVE: 'success',
  REFUSE: 'danger',
};

// Couleur par catégorie (onglet actif + pastille d'icône).
const CAT_TAB: Record<CategorieDemande, { active: string; grad: string }> = {
  PERMISSION: { active: 'border-brand-500 bg-brand-soft text-brand-soft-fg', grad: 'from-indigo-400 to-violet-600' },
  REPOS: { active: 'border-warning bg-warning-soft text-warning-soft-fg', grad: 'from-amber-400 to-orange-500' },
  CONGE: { active: 'border-success bg-success-soft text-success-soft-fg', grad: 'from-emerald-400 to-teal-600' },
};

const TABS: { key: CategorieDemande; label: string; icon: LucideIcon; hint: string }[] = [
  { key: 'PERMISSION', label: 'Permissions', icon: Clock, hint: 'Absence courte autorisée (rendez-vous, démarche…).' },
  { key: 'REPOS', label: 'Repos', icon: Coffee, hint: 'Journée(s) de repos / récupération.' },
  { key: 'CONGE', label: 'Congés', icon: Plane, hint: 'Congé annuel, maladie, sans solde ou exceptionnel.' },
];

const fmt = (iso: string) => new Date(iso).toLocaleDateString('fr-FR');

interface FormState {
  type: TypeConge;
  dateDebut: string;
  dateFin: string;
  heureDebut: string;
  heureFin: string;
  joursRepos: JourSemaine[];
  motif: string;
}
const EMPTY: FormState = { type: 'ANNUEL', dateDebut: '', dateFin: '', heureDebut: '', heureFin: '', joursRepos: [], motif: '' };

export function MesDemandesPage() {
  const { data: conges, isLoading, error } = useMyConges();
  const create = useCreateMyConge();
  const cancel = useCancelMyConge();

  const [tab, setTab] = useState<CategorieDemande>('PERMISSION');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<{ dateDebut?: string; dateFin?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);

  const all = useMemo(() => conges ?? [], [conges]);
  // Compat : les anciennes demandes sans catégorie comptent comme « Congé ».
  const list = all.filter((c) => (c.categorie ?? 'CONGE') === tab);
  const countByTab = (k: CategorieDemande) =>
    all.filter((c) => (c.categorie ?? 'CONGE') === k && c.statut === 'EN_ATTENTE').length;

  if (error) return <MeNotLinked />;

  const switchTab = (k: CategorieDemande) => {
    setTab(k);
    setOpen(false);
    setForm(EMPTY);
    setErrors({});
    setFormError(null);
  };

  const jours = nbJours(form.dateDebut, form.dateFin);
  const meta = TABS.find((t) => t.key === tab)!;

  const toggleJour = (j: JourSemaine) =>
    setForm((f) => ({
      ...f,
      joursRepos: f.joursRepos.includes(j) ? f.joursRepos.filter((x) => x !== j) : [...f.joursRepos, j],
    }));

  const submit = async () => {
    setErrors({});
    if (tab === 'REPOS') {
      // Repos hebdomadaire : on choisit des jours, pas une plage de dates.
      if (form.joursRepos.length === 0) return setFormError('Sélectionnez au moins un jour de repos.');
    } else {
      const errs: typeof errors = {};
      if (!form.dateDebut) errs.dateDebut = 'Date de début requise.';
      if (!form.dateFin) errs.dateFin = 'Date de fin requise.';
      else if (form.dateDebut && form.dateFin < form.dateDebut) errs.dateFin = 'La fin doit suivre le début.';
      setErrors(errs);
      if (Object.values(errs).some(Boolean)) return setFormError('Veuillez corriger les champs signalés.');
    }
    setFormError(null);
    try {
      const intraJournee = tab === 'PERMISSION' && !!form.heureDebut && !!form.heureFin;
      await create.mutateAsync({
        categorie: tab,
        type: tab === 'CONGE' ? form.type : undefined,
        dateDebut: tab === 'REPOS' ? '' : form.dateDebut,
        dateFin: tab === 'REPOS' ? '' : form.dateFin,
        heureDebut: intraJournee ? form.heureDebut : undefined,
        heureFin: intraJournee ? form.heureFin : undefined,
        joursRepos: tab === 'REPOS' ? form.joursRepos : undefined,
        motif: form.motif || undefined,
      });
      setForm(EMPTY);
      setOpen(false);
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Envoi impossible.'));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mes demandes"
        subtitle="Permissions, repos et congés — déposez et suivez vos demandes."
      />

      {/* Onglets */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = tab === t.key;
          const pending = countByTab(t.key);
          return (
            <button
              key={t.key}
              onClick={() => switchTab(t.key)}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors',
                active
                  ? CAT_TAB[t.key].active
                  : 'border-surface-border text-ink-muted hover:bg-surface-muted hover:text-ink',
              )}
            >
              <t.icon size={16} />
              {t.label}
              {pending > 0 && (
                <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-warning px-1.5 text-[11px] font-semibold text-white">
                  {pending}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-ink-muted">{meta.hint}</p>
        <Button onClick={() => setOpen((v) => !v)}>
          <Plus size={16} /> Nouvelle demande
        </Button>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="md"
        title={`Demande de ${CATEGORIE_LABEL[tab].toLowerCase()}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={() => void submit()} loading={create.isPending}>
              Soumettre la demande
            </Button>
          </>
        }
      >
        <div className="space-y-4">
            {tab === 'CONGE' && (
              <Select
                label="Type de congé *"
                options={TYPE_CONGE_OPTIONS}
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as TypeConge }))}
              />
            )}
            {tab === 'REPOS' ? (
              <div>
                <span className="text-sm font-medium text-ink">Jour(s) de repos *</span>
                <p className="text-xs text-ink-subtle">Repos hebdomadaire — choisissez le ou les jours de la semaine.</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {JOURS_ORDER.map((j) => {
                    const on = form.joursRepos.includes(j);
                    return (
                      <button
                        type="button"
                        key={j}
                        onClick={() => toggleJour(j)}
                        className={cn(
                          'rounded-xl border px-3 py-1.5 text-sm transition-colors',
                          on
                            ? 'border-brand-500 bg-brand-soft text-brand-soft-fg'
                            : 'border-surface-border text-ink-muted hover:bg-surface-muted',
                        )}
                      >
                        {JOUR_COURT[j]}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    type="date"
                    label="Du *"
                    value={form.dateDebut}
                    onChange={(e) => setForm((f) => ({ ...f, dateDebut: e.target.value }))}
                    error={errors.dateDebut}
                  />
                  <Input
                    type="date"
                    label="Au *"
                    value={form.dateFin}
                    onChange={(e) => setForm((f) => ({ ...f, dateFin: e.target.value }))}
                    error={errors.dateFin}
                  />
                </div>
                {tab === 'PERMISSION' && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      type="time"
                      label="De (heure, optionnel)"
                      value={form.heureDebut}
                      onChange={(e) => setForm((f) => ({ ...f, heureDebut: e.target.value }))}
                    />
                    <Input
                      type="time"
                      label="À (heure, optionnel)"
                      value={form.heureFin}
                      onChange={(e) => setForm((f) => ({ ...f, heureFin: e.target.value }))}
                    />
                  </div>
                )}
                {jours > 0 && (
                  <p className="text-sm text-ink-muted">
                    Durée :{' '}
                    <span className="font-medium text-ink">
                      {dureeLabel({
                        dateDebut: form.dateDebut,
                        dateFin: form.dateFin,
                        heureDebut: tab === 'PERMISSION' ? form.heureDebut : undefined,
                        heureFin: tab === 'PERMISSION' ? form.heureFin : undefined,
                      })}
                    </span>
                  </p>
                )}
              </>
            )}
            <Input
              label="Motif"
              value={form.motif}
              onChange={(e) => setForm((f) => ({ ...f, motif: e.target.value }))}
              placeholder={tab === 'CONGE' ? 'Optionnel' : 'Précisez le motif'}
            />
            {formError && <Callout tone="danger">{formError}</Callout>}
        </div>
      </Modal>

      <Card className="p-0">
        <div className="p-5 pb-0">
          <CardTitle>Historique — {meta.label}</CardTitle>
        </div>
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <EmptyState
            icon={<meta.icon size={20} />}
            title={`Aucune demande de ${CATEGORIE_LABEL[tab].toLowerCase()}`}
            description="Vos demandes de cette catégorie apparaîtront ici."
            className="py-10"
          />
        ) : (
          <Stagger className="mt-3 divide-y divide-surface-border">
            {list.map((c) => (
              <StaggerItem key={c.id} className="flex items-center justify-between gap-4 px-5 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white', CAT_TAB[tab].grad)}>
                    <meta.icon size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">
                      {tab === 'CONGE' ? TYPE_CONGE_LABEL[c.type] : CATEGORIE_LABEL[c.categorie ?? 'CONGE']}
                    </p>
                    <p className="text-xs text-ink-subtle">
                      {(c.categorie ?? 'CONGE') === 'REPOS' && c.joursRepos?.length
                        ? `Repos : ${joursReposLabel(c.joursRepos)}`
                        : `Du ${fmt(c.dateDebut)} au ${fmt(c.dateFin)} · ${dureeLabel(c)}`}
                      {c.motif ? ` · ${c.motif}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge tone={STATUT_TONE[c.statut]} dot>
                    {STATUT_CONGE_LABEL[c.statut]}
                  </Badge>
                  {c.statut === 'EN_ATTENTE' && (
                    <button
                      type="button"
                      onClick={() => cancel.mutate(c.id)}
                      disabled={cancel.isPending}
                      title="Annuler la demande"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-subtle transition-colors hover:bg-surface-muted hover:text-danger"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </Card>
    </div>
  );
}
