import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, Sparkles, Target, Users } from 'lucide-react';
import { Badge, Button, Card, PageHeader, Select, SkeletonRows, Textarea, cn } from '@drwindesk/ui';
import type { BadgeProps } from '@drwindesk/ui';
import { performanceService, type PerfEmploye, type TypeRecommandation } from './performance';

const RECO_OPTIONS = [
  { value: 'RECONDUCTION', label: 'Reconduction' },
  { value: 'PROMOTION', label: 'Promotion' },
  { value: 'FORMATION', label: 'Formation' },
  { value: 'AVERTISSEMENT', label: 'Avertissement' },
  { value: 'AUTRE', label: 'Autre' },
];

function scoreTone(s: number): NonNullable<BadgeProps['tone']> {
  return s >= 85 ? 'success' : s >= 70 ? 'brand' : s >= 55 ? 'warning' : 'danger';
}

export function PerformancePage() {
  const { data: perf, isLoading } = useQuery({ queryKey: ['eval', 'performance'], queryFn: performanceService.list });

  return (
    <div className="space-y-5">
      <PageHeader title="Performance & recommandation" subtitle="Évaluée sur le travail réel : activités, rapports, missions et objectifs." />

      {isLoading ? (
        <Card className="p-0"><SkeletonRows rows={3} cols={2} /></Card>
      ) : (
        <div className="space-y-4">
          {(perf ?? []).map((p) => <PerfCard key={p.employeId} p={p} />)}
        </div>
      )}
    </div>
  );
}

function PerfCard({ p }: { p: PerfEmploye }) {
  const qc = useQueryClient();
  const [reco, setReco] = useState(p.recommandation ?? '');
  const [type, setType] = useState<TypeRecommandation>(p.typeRecommandation ?? 'RECONDUCTION');
  const [openReco, setOpenReco] = useState(false);

  const generer = useMutation({
    mutationFn: () => performanceService.generer(p.employeId),
    onSuccess: (res) => { setReco(res.recommandation); setOpenReco(true); },
  });
  const save = useMutation({
    mutationFn: () => performanceService.save(p.employeId, reco, type),
    meta: { successMessage: 'Recommandation enregistrée' },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['eval', 'performance'] }),
  });

  const tachesPct = p.tachesTotal ? Math.round((p.tachesTerminees / p.tachesTotal) * 100) : 0;
  const indicateurs = [
    { label: 'Rapports', value: p.tauxRapports, icon: ClipboardList, suffix: '%' },
    { label: 'Missions', value: tachesPct, icon: Target, suffix: '%', detail: `${p.tachesTerminees}/${p.tachesTotal}` },
    { label: 'Présence', value: p.tauxPresence, icon: Users, suffix: '%' },
    { label: 'OKR', value: p.tauxOkr, icon: Target, suffix: '%' },
  ];

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-semibold text-ink">{p.employeNom}</div>
          {p.poste && <div className="text-xs text-ink-subtle">{p.poste}</div>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-ink-muted">Score</span>
          <Badge tone={scoreTone(p.scoreGlobal)}><span className="text-base font-bold">{p.scoreGlobal}</span>/100</Badge>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {indicateurs.map((ind) => (
          <div key={ind.label}>
            <div className="mb-1 flex items-center justify-between text-xs text-ink-muted">
              <span className="flex items-center gap-1"><ind.icon size={13} /> {ind.label}</span>
              <span className="text-ink">{ind.detail ?? `${ind.value}${ind.suffix}`}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
              <div className={cn('h-full rounded-full', ind.value >= 80 ? 'bg-success' : ind.value >= 60 ? 'bg-brand-500' : 'bg-warning')} style={{ width: `${Math.min(100, ind.value)}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-surface-border pt-3">
        <Button size="sm" variant="secondary" loading={generer.isPending} onClick={() => generer.mutate()}>
          <Sparkles size={14} /> Générer la recommandation (IA)
        </Button>
        {p.recommandation && !openReco && <Badge tone="success">Recommandation enregistrée</Badge>}
        <button type="button" onClick={() => setOpenReco((v) => !v)} className="text-sm text-brand-600 hover:underline">
          {openReco ? 'Masquer' : 'Saisir / éditer'}
        </button>
      </div>

      {openReco && (
        <div className="space-y-3">
          <Textarea id={`reco-${p.employeId}`} label="Recommandation (à vérifier)" rows={5} value={reco} onChange={(e) => setReco(e.target.value)} />
          <div className="flex flex-wrap items-end justify-between gap-3">
            <Select id={`type-${p.employeId}`} label="Type" value={type} onChange={(e) => setType(e.target.value as TypeRecommandation)} options={RECO_OPTIONS} />
            <Button size="sm" loading={save.isPending} disabled={!reco.trim()} onClick={() => save.mutate()}>Enregistrer</Button>
          </div>
        </div>
      )}
    </Card>
  );
}
