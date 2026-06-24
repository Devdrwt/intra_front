import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarPlus, GraduationCap, Plus, UserPlus } from 'lucide-react';
import { Badge, Button, Card, CardTitle, Input, Modal, PageHeader, Select, SkeletonRows } from '@drwindesk/ui';
import type { BadgeProps } from '@drwindesk/ui';
import { fcfa } from '@/lib/money';
import { Stagger, StaggerItem } from '@/components/motion';
import { useEmployes } from '@/features/rh/hooks';
import { formationService, type DemandeFormation, type Formation, type SessionInput, type StatutSession } from './service';

const SESSION_TONE: Record<StatutSession, NonNullable<BadgeProps['tone']>> = {
  PLANIFIEE: 'brand', OUVERTE: 'success', COMPLETE: 'warning', TERMINEE: 'neutral', ANNULEE: 'danger',
};

const TONE: Record<DemandeFormation['statut'], NonNullable<BadgeProps['tone']>> = {
  BROUILLON: 'neutral',
  SOUMISE: 'warning',
  APPROUVEE: 'brand',
  REJETEE: 'danger',
  INSCRITE: 'success',
};
const STATUT_LABEL: Record<DemandeFormation['statut'], string> = {
  BROUILLON: 'Brouillon',
  SOUMISE: 'Soumise',
  APPROUVEE: 'Approuvée',
  REJETEE: 'Rejetée',
  INSCRITE: 'Inscrite',
};

export function FormationPage() {
  const qc = useQueryClient();
  const { data: catalogue, isLoading } = useQuery({ queryKey: ['formation', 'catalogue'], queryFn: formationService.catalogue });
  const { data: demandes } = useQuery({ queryKey: ['formation', 'demandes'], queryFn: formationService.demandes });
  const demander = useMutation({
    mutationFn: ({ titre, cout }: { titre: string; cout?: number }) => formationService.demander(titre, cout),
    meta: { successMessage: 'Demande de formation soumise' },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['formation'] }),
  });

  return (
    <div className="space-y-5">
      <PageHeader title="Formation" subtitle="Catalogue, demandes (validées par le moteur) et développement des compétences." />

      {(demandes ?? []).length > 0 && (
        <Card className="p-0">
          <div className="p-5 pb-2"><CardTitle>Mes demandes</CardTitle></div>
          <ul className="divide-y divide-surface-border">
            {(demandes ?? []).map((d, i) => (
              <li key={d.id} className="flex items-center justify-between gap-3 px-5 py-3 animate-row" style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}>
                <div>
                  <div className="font-medium text-ink">{d.formationTitre}</div>
                  <div className="text-xs text-ink-subtle">{d.reference}{d.coutEstime ? ` · ${fcfa(d.coutEstime)}` : ''}</div>
                </div>
                <Badge tone={TONE[d.statut]} dot>{STATUT_LABEL[d.statut]}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <SessionsSection catalogue={catalogue ?? []} />

      <CardTitle>Catalogue</CardTitle>
      {isLoading ? (
        <Card className="p-0"><SkeletonRows rows={3} cols={2} /></Card>
      ) : (
        <Stagger className="grid gap-4 lg:grid-cols-3">
          {(catalogue ?? []).map((f) => (
            <StaggerItem key={f.id} className="h-full">
            <Card className="flex h-full flex-col justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-ink-muted">
                  <GraduationCap size={16} /> <span className="text-xs">{f.type}{f.organisme ? ` · ${f.organisme}` : ''}</span>
                </div>
                <div className="mt-1 font-semibold text-ink">{f.titre}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {f.competencesVisees.map((c) => <Badge key={c} tone="neutral">{c}</Badge>)}
                </div>
                <div className="mt-2 text-xs text-ink-subtle">
                  {f.dureeHeures ? `${f.dureeHeures} h` : ''}{f.coutEstime ? ` · ${fcfa(f.coutEstime)}` : ''}
                </div>
              </div>
              <Button size="sm" variant="secondary" disabled={demander.isPending} onClick={() => demander.mutate({ titre: f.titre, cout: f.coutEstime })}>
                <Plus size={14} /> Demander
              </Button>
            </Card>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  );
}

function SessionsSection({ catalogue }: { catalogue: Formation[] }) {
  const qc = useQueryClient();
  const { data: sessions } = useQuery({ queryKey: ['formation', 'sessions'], queryFn: formationService.sessions });
  const [plan, setPlan] = useState(false);
  const [inscrireSession, setInscrireSession] = useState<string | null>(null);

  return (
    <Card className="p-0">
      <div className="flex items-center justify-between p-5 pb-2">
        <CardTitle>Sessions planifiées</CardTitle>
        <Button size="sm" onClick={() => setPlan(true)}><CalendarPlus size={14} /> Planifier</Button>
      </div>
      <ul className="divide-y divide-surface-border">
        {(sessions ?? []).map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
            <div className="min-w-0">
              <div className="truncate font-medium text-ink">{s.formationTitre}</div>
              <div className="text-xs text-ink-subtle">
                {s.dateDebut} → {s.dateFin}{s.lieu ? ` · ${s.lieu}` : ''} · {s.nbInscrits}{s.capacite ? `/${s.capacite}` : ''} inscrit(s)
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={SESSION_TONE[s.statut]} dot>{s.statut}</Badge>
              <Button size="sm" variant="ghost" onClick={() => setInscrireSession(s.id)}><UserPlus size={14} /> Inscrire</Button>
            </div>
          </li>
        ))}
        {(sessions ?? []).length === 0 && <li className="px-5 py-4 text-sm text-ink-subtle">Aucune session planifiée.</li>}
      </ul>

      {plan && <PlanSessionModal catalogue={catalogue} onClose={() => setPlan(false)} onDone={() => qc.invalidateQueries({ queryKey: ['formation', 'sessions'] })} />}
      {inscrireSession && <InscrireModal sessionId={inscrireSession} onClose={() => setInscrireSession(null)} onDone={() => qc.invalidateQueries({ queryKey: ['formation', 'sessions'] })} />}
    </Card>
  );
}

function PlanSessionModal({ catalogue, onClose, onDone }: { catalogue: Formation[]; onClose: () => void; onDone: () => void }) {
  const create = useMutation({
    mutationFn: (input: SessionInput) => formationService.createSession(input),
    meta: { successMessage: 'Session planifiée' },
    onSuccess: () => { onDone(); onClose(); },
  });
  const [formationId, setFormationId] = useState(catalogue[0]?.id ?? '');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [lieu, setLieu] = useState('');
  const [formateur, setFormateur] = useState('');
  const [capacite, setCapacite] = useState('');
  const valid = formationId && dateDebut && dateFin;

  return (
    <Modal open onClose={onClose} size="md" title="Planifier une session" footer={
      <>
        <Button variant="secondary" onClick={onClose}>Annuler</Button>
        <Button onClick={() => create.mutate({ formationId, dateDebut, dateFin, lieu: lieu || undefined, formateur: formateur || undefined, capacite: capacite ? Number(capacite) : undefined })} loading={create.isPending} disabled={!valid}>Planifier</Button>
      </>
    }>
      <div className="space-y-4">
        <Select label="Formation *" value={formationId} onChange={(e) => setFormationId(e.target.value)} options={catalogue.map((f) => ({ value: f.id, label: f.titre }))} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input type="date" label="Du *" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
          <Input type="date" label="Au *" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Lieu" value={lieu} onChange={(e) => setLieu(e.target.value)} />
          <Input label="Formateur" value={formateur} onChange={(e) => setFormateur(e.target.value)} />
          <Input type="number" label="Capacité" value={capacite} onChange={(e) => setCapacite(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}

function InscrireModal({ sessionId, onClose, onDone }: { sessionId: string; onClose: () => void; onDone: () => void }) {
  const { data: employes } = useEmployes({});
  const [employeId, setEmployeId] = useState('');
  const inscrire = useMutation({
    mutationFn: () => formationService.inscrire(sessionId, employeId),
    meta: { successMessage: 'Inscription enregistrée' },
    onSuccess: () => { onDone(); onClose(); },
  });

  return (
    <Modal open onClose={onClose} size="sm" title="Inscrire un collaborateur" footer={
      <>
        <Button variant="secondary" onClick={onClose}>Annuler</Button>
        <Button onClick={() => inscrire.mutate()} loading={inscrire.isPending} disabled={!employeId}>Inscrire</Button>
      </>
    }>
      <Select label="Collaborateur *" value={employeId} onChange={(e) => setEmployeId(e.target.value)} placeholder="Choisir…"
        options={(employes ?? []).map((emp) => ({ value: emp.id, label: `${emp.prenom} ${emp.nom}` }))} />
    </Modal>
  );
}
