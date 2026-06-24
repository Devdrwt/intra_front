import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Pencil, Plus, Target, Trash2, Users } from 'lucide-react';
import { Badge, Button, Card, CardTitle, Input, Modal, PageHeader, Select, SkeletonRows, cn } from '@drwindesk/ui';
import { Stagger, StaggerItem } from '@/components/motion';
import { useEmployes } from '@/features/rh/hooks';
import {
  evaluationService,
  type NiveauObjectif,
  type ObjectifInput,
  type ResultatCle,
  type ResultatCleInput,
} from './service';

const NIVEAU_LABEL: Record<NiveauObjectif, string> = {
  INDIVIDUEL: 'Individuel',
  EQUIPE: 'Équipe',
  ENTREPRISE: 'Entreprise',
};

export function EvaluationPage() {
  const qc = useQueryClient();
  const { data: objectifs, isLoading } = useQuery({ queryKey: ['eval', 'objectifs'], queryFn: evaluationService.objectifs });
  const { data: campagnes } = useQuery({ queryKey: ['eval', 'campagnes'], queryFn: evaluationService.campagnes });
  const [showNew, setShowNew] = useState(false);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['eval', 'objectifs'] });
  const remove = useMutation({ mutationFn: (id: string) => evaluationService.removeObjectif(id), meta: { successMessage: 'Objectif supprimé' }, onSuccess: invalidate });
  const updateKr = useMutation({ mutationFn: ({ id, v }: { id: string; v: number }) => evaluationService.updateResultatCle(id, v), onSuccess: invalidate });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Évaluation & Objectifs"
        subtitle="OKR (objectifs et résultats clés) et campagnes d'évaluation."
        actions={<Button onClick={() => setShowNew(true)}><Plus size={16} /> Nouvel objectif</Button>}
      />

      {(campagnes ?? []).length > 0 && (
        <Card className="p-0">
          <div className="p-5 pb-2"><CardTitle>Campagnes d'évaluation</CardTitle></div>
          <ul className="divide-y divide-surface-border">
            {(campagnes ?? []).map((c, i) => (
              <li key={c.id} className="flex items-center justify-between gap-3 px-5 py-3 animate-row" style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}>
                <div>
                  <div className="font-medium text-ink">{c.nom}</div>
                  <div className="text-xs text-ink-subtle">{c.nbEvaluations} évaluation(s)</div>
                </div>
                <Badge tone={c.statut === 'EN_COURS' ? 'warning' : c.statut === 'CLOTUREE' ? 'success' : 'neutral'} dot>
                  {c.statut === 'EN_COURS' ? 'En cours' : c.statut === 'CLOTUREE' ? 'Clôturée' : 'Planifiée'}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <CardTitle>Objectifs (OKR)</CardTitle>
      {isLoading ? (
        <Card className="p-0"><SkeletonRows rows={3} cols={2} /></Card>
      ) : (objectifs ?? []).length === 0 ? (
        <Card className="text-center text-sm text-ink-subtle">Aucun objectif — créez le premier OKR.</Card>
      ) : (
        <Stagger className="grid gap-4 lg:grid-cols-2">
          {(objectifs ?? []).map((o) => (
            <StaggerItem key={o.id} className="h-full">
              <Card className="h-full space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 text-ink-muted">
                      {o.niveau === 'EQUIPE' || o.niveau === 'ENTREPRISE' ? <Users size={16} /> : <Target size={16} />}
                      <span className="text-xs">{NIVEAU_LABEL[o.niveau]} · {o.periode}</span>
                    </div>
                    <div className="mt-1 font-semibold text-ink">{o.titre}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-brand-600">{o.progression}%</span>
                    <button onClick={() => remove.mutate(o.id)} disabled={remove.isPending} className="text-ink-subtle hover:text-danger" title="Supprimer">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                  <div className={cn('h-full rounded-full', o.progression >= 70 ? 'bg-success' : 'bg-brand-500')} style={{ width: `${o.progression}%` }} />
                </div>
                <ul className="space-y-2">
                  {o.resultatsCles.map((r) => (
                    <KrRow key={r.id} r={r} onSave={(v) => updateKr.mutate({ id: r.id, v })} saving={updateKr.isPending} />
                  ))}
                </ul>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      )}

      {showNew && <ObjectifModal onClose={() => setShowNew(false)} onSaved={invalidate} />}
    </div>
  );
}

function KrRow({ r, onSave, saving }: { r: ResultatCle; onSave: (v: number) => void; saving: boolean }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(r.valeurActuelle));
  const pct = r.valeurCible ? Math.min(100, Math.round((r.valeurActuelle / r.valeurCible) * 100)) : 0;

  return (
    <li className="text-sm">
      <div className="flex items-center justify-between gap-2 text-ink-muted">
        <span className="min-w-0 truncate">{r.libelle}</span>
        {editing ? (
          <span className="flex shrink-0 items-center gap-1">
            <input type="number" value={val} onChange={(e) => setVal(e.target.value)} className="w-16 rounded-md border border-surface-border bg-surface px-1.5 py-0.5 text-right text-sm" />
            <button onClick={() => { onSave(Number(val)); setEditing(false); }} disabled={saving} className="text-emerald-600 hover:text-emerald-700"><Check size={15} /></button>
          </span>
        ) : (
          <button onClick={() => { setVal(String(r.valeurActuelle)); setEditing(true); }} className="flex shrink-0 items-center gap-1 text-ink hover:text-brand-600">
            {r.valeurActuelle}/{r.valeurCible} {r.unite} <Pencil size={12} className="text-ink-subtle" />
          </button>
        )}
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-muted">
        <div className="h-full rounded-full bg-brand-400" style={{ width: `${pct}%` }} />
      </div>
    </li>
  );
}

const currentQuarter = () => {
  const d = new Date();
  return `${d.getFullYear()}-T${Math.floor(d.getMonth() / 3) + 1}`;
};

function ObjectifModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const create = useMutation({ mutationFn: (input: ObjectifInput) => evaluationService.createObjectif(input), meta: { successMessage: 'Objectif créé' }, onSuccess: () => { onSaved(); onClose(); } });
  const { data: employes } = useEmployes({});
  const [niveau, setNiveau] = useState<NiveauObjectif>('ENTREPRISE');
  const [titre, setTitre] = useState('');
  const [periode, setPeriode] = useState(currentQuarter());
  const [employeId, setEmployeId] = useState('');
  const [krs, setKrs] = useState<ResultatCleInput[]>([{ libelle: '', valeurCible: 100, unite: '%' }]);

  const setKr = (i: number, patch: Partial<ResultatCleInput>) => setKrs((l) => l.map((k, idx) => (idx === i ? { ...k, ...patch } : k)));
  const valid = titre.trim().length >= 2 && krs.every((k) => k.libelle.trim()) && (niveau !== 'INDIVIDUEL' || employeId);

  const submit = () => {
    if (!valid) return;
    create.mutate({
      niveau,
      titre: titre.trim(),
      periode,
      employeId: niveau === 'INDIVIDUEL' ? employeId : undefined,
      resultatsCles: krs.map((k) => ({ libelle: k.libelle.trim(), valeurCible: Number(k.valeurCible), unite: k.unite || undefined })),
    });
  };

  return (
    <Modal open onClose={onClose} size="lg" title="Nouvel objectif (OKR)" footer={
      <>
        <Button variant="secondary" onClick={onClose}>Annuler</Button>
        <Button onClick={submit} loading={create.isPending} disabled={!valid}>Créer</Button>
      </>
    }>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Niveau" value={niveau} onChange={(e) => setNiveau(e.target.value as NiveauObjectif)} options={[
            { value: 'ENTREPRISE', label: 'Entreprise' },
            { value: 'EQUIPE', label: 'Équipe' },
            { value: 'INDIVIDUEL', label: 'Individuel' },
          ]} />
          <Input label="Période" value={periode} onChange={(e) => setPeriode(e.target.value)} placeholder="2026-T1" />
        </div>
        {niveau === 'INDIVIDUEL' && (
          <Select label="Collaborateur *" value={employeId} onChange={(e) => setEmployeId(e.target.value)} placeholder="Choisir…"
            options={(employes ?? []).map((emp) => ({ value: emp.id, label: `${emp.prenom} ${emp.nom}` }))} />
        )}
        <Input label="Titre *" value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex. Satisfaction client" />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-ink-muted">Résultats clés</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => setKrs((l) => [...l, { libelle: '', valeurCible: 100, unite: '%' }])}><Plus size={14} /> Ajouter</Button>
          </div>
          <div className="space-y-2">
            {krs.map((k, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input value={k.libelle} onChange={(e) => setKr(i, { libelle: e.target.value })} placeholder="Indicateur" className="flex-1" />
                <Input type="number" value={String(k.valeurCible)} onChange={(e) => setKr(i, { valeurCible: Number(e.target.value) })} className="w-24" placeholder="Cible" />
                <Input value={k.unite ?? ''} onChange={(e) => setKr(i, { unite: e.target.value })} className="w-20" placeholder="unité" />
                {krs.length > 1 && (
                  <button type="button" onClick={() => setKrs((l) => l.filter((_, idx) => idx !== i))} className="text-ink-subtle hover:text-danger"><Trash2 size={15} /></button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
