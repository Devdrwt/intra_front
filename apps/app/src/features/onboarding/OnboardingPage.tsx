import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Circle, Rocket, LogOut } from 'lucide-react';
import { Badge, Card, PageHeader, SkeletonRows, cn } from '@drwindesk/ui';
import { Stagger, StaggerItem } from '@/components/motion';
import { onboardingService, type Parcours } from './service';

export function OnboardingPage() {
  const qc = useQueryClient();
  const { data: parcours, isLoading } = useQuery({ queryKey: ['onboarding', 'parcours'], queryFn: onboardingService.list });
  const toggle = useMutation({
    mutationFn: ({ parcoursId, etapeId }: { parcoursId: string; etapeId: string }) =>
      onboardingService.toggleEtape(parcoursId, etapeId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['onboarding'] }),
  });

  return (
    <div className="space-y-5">
      <PageHeader title="Onboarding / Offboarding" subtitle="Parcours d'intégration et de départ — chaque étape est une tâche assignée." />

      {isLoading ? (
        <Card className="p-0"><SkeletonRows rows={3} cols={2} /></Card>
      ) : (
        <Stagger className="grid gap-4 lg:grid-cols-2">
          {(parcours ?? []).map((p) => (
            <StaggerItem key={p.id} className="h-full">
              <ParcoursCard p={p} onToggle={(etapeId) => toggle.mutate({ parcoursId: p.id, etapeId })} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  );
}

function ParcoursCard({ p, onToggle }: { p: Parcours; onToggle: (etapeId: string) => void }) {
  const done = p.etapes.filter((e) => e.faite).length;
  const pct = p.etapes.length ? Math.round((done / p.etapes.length) * 100) : 0;
  return (
    <Card className="h-full space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {p.type === 'ONBOARDING' ? <Rocket size={18} className="text-brand-600" /> : <LogOut size={18} className="text-ink-muted" />}
          <div>
            <div className="font-semibold text-ink">{p.employeNom}</div>
            <div className="text-xs text-ink-subtle">{p.type === 'ONBOARDING' ? 'Intégration' : 'Départ'} · réf. {p.dateReference}</div>
          </div>
        </div>
        <Badge tone={pct === 100 ? 'success' : 'warning'}>{done}/{p.etapes.length}</Badge>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
        <div className={cn('h-full rounded-full', pct === 100 ? 'bg-success' : 'bg-brand-500')} style={{ width: `${pct}%` }} />
      </div>
      <ul className="space-y-1">
        {p.etapes.map((e) => (
          <li key={e.id}>
            <button onClick={() => onToggle(e.id)} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-surface-muted">
              {e.faite ? <CheckCircle2 size={16} className="text-success" /> : <Circle size={16} className="text-ink-subtle" />}
              <span className={cn('flex-1', e.faite && 'text-ink-subtle line-through')}>{e.titre}</span>
              <Badge tone="neutral">{e.responsable}</Badge>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
