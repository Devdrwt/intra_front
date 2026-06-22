import { useQuery } from '@tanstack/react-query';
import { Target, Users } from 'lucide-react';
import { Badge, Card, CardTitle, PageHeader, SkeletonRows, cn } from '@drwindesk/ui';
import { Stagger, StaggerItem } from '@/components/motion';
import { evaluationService, type NiveauObjectif } from './service';

const NIVEAU_LABEL: Record<NiveauObjectif, string> = {
  INDIVIDUEL: 'Individuel',
  EQUIPE: 'Équipe',
  ENTREPRISE: 'Entreprise',
};

export function EvaluationPage() {
  const { data: objectifs, isLoading } = useQuery({ queryKey: ['eval', 'objectifs'], queryFn: evaluationService.objectifs });
  const { data: campagnes } = useQuery({ queryKey: ['eval', 'campagnes'], queryFn: evaluationService.campagnes });

  return (
    <div className="space-y-5">
      <PageHeader title="Évaluation & Objectifs" subtitle="OKR (objectifs et résultats clés) et campagnes d'évaluation." />

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
                <span className="text-lg font-bold text-brand-600">{o.progression}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                <div className={cn('h-full rounded-full', o.progression >= 70 ? 'bg-success' : 'bg-brand-500')} style={{ width: `${o.progression}%` }} />
              </div>
              <ul className="space-y-2">
                {o.resultatsCles.map((r) => {
                  const pct = r.valeurCible ? Math.min(100, Math.round((r.valeurActuelle / r.valeurCible) * 100)) : 0;
                  return (
                    <li key={r.id} className="text-sm">
                      <div className="flex justify-between text-ink-muted">
                        <span>{r.libelle}</span>
                        <span className="text-ink">{r.valeurActuelle}/{r.valeurCible} {r.unite}</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-muted">
                        <div className="h-full rounded-full bg-brand-400" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  );
}
