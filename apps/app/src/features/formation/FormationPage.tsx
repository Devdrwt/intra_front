import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { GraduationCap, Plus } from 'lucide-react';
import { Badge, Button, Card, CardTitle, SkeletonRows } from '@drwindesk/ui';
import type { BadgeProps } from '@drwindesk/ui';
import { fcfa } from '@/lib/money';
import { formationService, type DemandeFormation } from './service';

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
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-ink">Formation</h2>
        <p className="text-ink-muted">Catalogue, demandes (validées par le moteur) et développement des compétences.</p>
      </header>

      {(demandes ?? []).length > 0 && (
        <Card className="p-0">
          <div className="p-5 pb-2"><CardTitle>Mes demandes</CardTitle></div>
          <ul className="divide-y divide-surface-border">
            {(demandes ?? []).map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 px-5 py-3">
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

      <CardTitle>Catalogue</CardTitle>
      {isLoading ? (
        <Card className="p-0"><SkeletonRows rows={3} cols={2} /></Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {(catalogue ?? []).map((f) => (
            <Card key={f.id} className="flex flex-col justify-between gap-3">
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
          ))}
        </div>
      )}
    </div>
  );
}
