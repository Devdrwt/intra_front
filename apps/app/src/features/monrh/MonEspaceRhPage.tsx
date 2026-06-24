import { useQuery } from '@tanstack/react-query';
import { Award, GraduationCap, Target, Users } from 'lucide-react';
import { Badge, Card, CardTitle, PageHeader, Skeleton, cn } from '@drwindesk/ui';
import type { BadgeProps } from '@drwindesk/ui';
import { Stagger, StaggerItem } from '@/components/motion';
import { monrhService } from './service';

const pct = (n: number) => `${Math.round(n)}%`;
const fmt = (iso: string) => (iso ? new Date(iso).toLocaleDateString('fr-FR') : '—');

const EVAL_TONE: Record<string, NonNullable<BadgeProps['tone']>> = {
  BROUILLON: 'neutral',
  AUTO_EVALUEE: 'warning',
  EVALUEE: 'brand',
  VALIDEE: 'success',
};
const INSC_TONE: Record<string, NonNullable<BadgeProps['tone']>> = {
  INSCRIT: 'brand',
  PRESENT: 'success',
  ABSENT: 'danger',
  ANNULE: 'neutral',
};

export function MonEspaceRhPage() {
  const perf = useQuery({ queryKey: ['monrh', 'performance'], queryFn: monrhService.performance });
  const objectifs = useQuery({ queryKey: ['monrh', 'objectifs'], queryFn: monrhService.objectifs });
  const evals = useQuery({ queryKey: ['monrh', 'evaluations'], queryFn: monrhService.evaluations });
  const formations = useQuery({ queryKey: ['monrh', 'formations'], queryFn: monrhService.formations });

  return (
    <div className="space-y-5">
      <PageHeader title="Mon espace RH" subtitle="Mes objectifs, mes évaluations, ma performance et mes formations." />

      {/* Performance */}
      {perf.isLoading ? (
        <Skeleton className="h-28 w-full rounded-2xl" />
      ) : perf.data ? (
        <Card className="bg-gradient-to-br from-brand-soft/60 to-transparent">
          <div className="flex items-center gap-2"><Award size={18} className="text-brand-600" /><CardTitle>Ma performance — {perf.data.periode}</CardTitle></div>
          <div className="mt-4 flex flex-wrap items-end gap-6">
            <div>
              <div className="text-4xl font-bold text-ink">{Math.round(perf.data.scoreGlobal)}<span className="text-lg text-ink-subtle">/100</span></div>
              <div className="text-xs text-ink-subtle">Score global</div>
            </div>
            <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric label="Rapports" value={pct(perf.data.tauxRapports)} />
              <Metric label="Tâches" value={`${perf.data.tachesTerminees}/${perf.data.tachesTotal}`} />
              <Metric label="Présence" value={pct(perf.data.tauxPresence)} />
              <Metric label="OKR" value={pct(perf.data.tauxOkr)} />
            </div>
          </div>
          {perf.data.recommandation && (
            <p className="mt-3 rounded-xl bg-surface-muted px-3 py-2 text-sm text-ink-muted">💡 {perf.data.recommandation}</p>
          )}
        </Card>
      ) : null}

      {/* Objectifs */}
      <div className="flex items-center gap-2"><Target size={18} className="text-ink-muted" /><CardTitle>Mes objectifs</CardTitle></div>
      {objectifs.isLoading ? (
        <Skeleton className="h-24 w-full rounded-2xl" />
      ) : (objectifs.data ?? []).length === 0 ? (
        <Card className="text-sm text-ink-subtle">Aucun objectif assigné.</Card>
      ) : (
        <Stagger className="grid gap-4 lg:grid-cols-2">
          {(objectifs.data ?? []).map((o) => (
            <StaggerItem key={o.id} className="h-full">
              <Card className="h-full space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold text-ink">{o.titre}</div>
                  <span className="text-lg font-bold text-brand-600">{o.progression}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                  <div className={cn('h-full rounded-full', o.progression >= 70 ? 'bg-success' : 'bg-brand-500')} style={{ width: `${o.progression}%` }} />
                </div>
                <ul className="space-y-1 pt-1">
                  {o.resultatsCles.map((r) => (
                    <li key={r.id} className="flex justify-between text-sm text-ink-muted">
                      <span className="truncate">{r.libelle}</span>
                      <span className="text-ink">{r.valeurActuelle}/{r.valeurCible} {r.unite}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Évaluations */}
        <Card className="p-0">
          <div className="flex items-center gap-2 p-5 pb-2"><Users size={18} className="text-ink-muted" /><CardTitle>Mes évaluations</CardTitle></div>
          {evals.isLoading ? (
            <div className="p-5"><Skeleton className="h-16 w-full" /></div>
          ) : (evals.data ?? []).length === 0 ? (
            <p className="p-5 text-sm text-ink-subtle">Aucune évaluation.</p>
          ) : (
            <ul className="divide-y divide-surface-border">
              {(evals.data ?? []).map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div>
                    <div className="text-sm font-medium text-ink">{fmt(e.updatedAt)}</div>
                    {e.noteGlobale != null && <div className="text-xs text-ink-subtle">Note : {e.noteGlobale}/5</div>}
                  </div>
                  <Badge tone={EVAL_TONE[e.statut] ?? 'neutral'} dot>{e.statut}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Formations */}
        <Card className="p-0">
          <div className="flex items-center gap-2 p-5 pb-2"><GraduationCap size={18} className="text-ink-muted" /><CardTitle>Mes formations</CardTitle></div>
          {formations.isLoading ? (
            <div className="p-5"><Skeleton className="h-16 w-full" /></div>
          ) : (formations.data?.inscriptions ?? []).length === 0 ? (
            <p className="p-5 text-sm text-ink-subtle">
              Aucune formation suivie.
              {(formations.data?.demandes ?? []).length > 0 && ` ${formations.data!.demandes.length} demande(s) en cours.`}
            </p>
          ) : (
            <ul className="divide-y divide-surface-border">
              {(formations.data?.inscriptions ?? []).map((ins) => (
                <li key={ins.sessionId} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-ink">{ins.formationTitre || 'Formation'}</div>
                    <div className="text-xs text-ink-subtle">
                      {fmt(ins.dateDebut)} – {fmt(ins.dateFin)}
                      {ins.competencesValidees.length > 0 ? ` · ${ins.competencesValidees.length} compétence(s) validée(s)` : ''}
                    </div>
                  </div>
                  <Badge tone={INSC_TONE[ins.statut] ?? 'neutral'} dot>{ins.statut}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface/70 px-3 py-2 text-center">
      <div className="text-lg font-bold text-ink">{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-ink-subtle">{label}</div>
    </div>
  );
}
