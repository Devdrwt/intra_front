import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarPlus, ChevronRight, Mic, Plus, Radio, Video } from 'lucide-react';
import { Badge, Button, Card, CardTitle, Input, PageHeader, Select, SkeletonRows, cn } from '@drwindesk/ui';
import type { BadgeProps } from '@drwindesk/ui';
import { studioService, type Reservation, type StatutProduction, type TypeProduction } from './service';

const TYPE_ICON: Record<TypeProduction, typeof Mic> = { PODCAST: Mic, VIDEO: Video, ENREGISTREMENT: Radio, LIVE: Radio, AUTRE: Radio };
const STATUT_TONE: Record<StatutProduction, NonNullable<BadgeProps['tone']>> = {
  IDEE: 'neutral', PLANIFIE: 'brand', TOURNAGE: 'warning', MONTAGE: 'warning', PUBLIE: 'success', ANNULE: 'danger',
};
const STATUT_LABEL: Record<StatutProduction, string> = {
  IDEE: 'Idée', PLANIFIE: 'Planifié', TOURNAGE: 'Tournage', MONTAGE: 'Montage', PUBLIE: 'Publié', ANNULE: 'Annulé',
};
const NEXT: Partial<Record<StatutProduction, StatutProduction>> = {
  IDEE: 'PLANIFIE', PLANIFIE: 'TOURNAGE', TOURNAGE: 'MONTAGE', MONTAGE: 'PUBLIE',
};

export function StudioPage() {
  const qc = useQueryClient();
  const { data: productions, isLoading } = useQuery({ queryKey: ['studio', 'productions'], queryFn: studioService.productions });
  const { data: reservations } = useQuery({ queryKey: ['studio', 'reservations'], queryFn: studioService.reservations });
  const move = useMutation({
    mutationFn: ({ id, statut }: { id: string; statut: StatutProduction }) => studioService.moveProduction(id, statut),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['studio'] }),
  });
  const create = useMutation({
    mutationFn: ({ titre, type }: { titre: string; type: TypeProduction }) => studioService.createProduction(titre, type),
    meta: { successMessage: 'Production créée' },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['studio'] }),
  });

  const [titre, setTitre] = useState('');
  const [type, setType] = useState<TypeProduction>('PODCAST');

  const onCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!titre.trim()) return;
    create.mutate({ titre: titre.trim(), type });
    setTitre('');
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Studio" subtitle="Productions média (podcasts, vidéos, enregistrements) et planning du studio." />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <form onSubmit={onCreate} className="flex flex-wrap items-end gap-3">
              <Input id="titre" label="Nouvelle production" value={titre} onChange={(e) => setTitre(e.target.value)} className="min-w-[200px] flex-1" placeholder="Titre…" />
              <Select id="type" label="Type" value={type} onChange={(e) => setType(e.target.value as TypeProduction)}
                options={[{ value: 'PODCAST', label: 'Podcast' }, { value: 'VIDEO', label: 'Vidéo' }, { value: 'ENREGISTREMENT', label: 'Enregistrement' }, { value: 'LIVE', label: 'Live' }]} />
              <Button type="submit" loading={create.isPending}><Plus size={16} /> Ajouter</Button>
            </form>
          </Card>

          {isLoading ? (
            <Card className="p-0"><SkeletonRows rows={3} cols={2} /></Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {(productions ?? []).map((p) => {
                const Icon = TYPE_ICON[p.type];
                const next = NEXT[p.statut];
                return (
                  <Card key={p.id} className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 text-ink-muted"><Icon size={16} /><span className="text-xs">{p.type}</span></div>
                      <Badge tone={STATUT_TONE[p.statut]} dot>{STATUT_LABEL[p.statut]}</Badge>
                    </div>
                    <div className="font-medium text-ink">{p.titre}</div>
                    <div className="text-xs text-ink-subtle">{p.reference}{p.datePublicationPrevue ? ` · pub. ${p.datePublicationPrevue}` : ''}</div>
                    {next && (
                      <button onClick={() => move.mutate({ id: p.id, statut: next })} className={cn('inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-brand-700 hover:bg-brand-soft')}>
                        Avancer <ChevronRight size={12} />
                      </button>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <PlanningCard reservations={reservations ?? []} />
      </div>
    </div>
  );
}

function PlanningCard({ reservations }: { reservations: Reservation[] }) {
  const qc = useQueryClient();
  const reserver = useMutation({
    mutationFn: (r: Omit<Reservation, 'id'>) => studioService.reserver(r),
    meta: { successMessage: 'Créneau réservé' },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['studio', 'reservations'] }),
  });
  const [date, setDate] = useState('');
  const [hd, setHd] = useState('09:00');
  const [hf, setHf] = useState('11:00');
  const [objet, setObjet] = useState('');

  const onReserve = (e: FormEvent) => {
    e.preventDefault();
    if (!date) return;
    reserver.mutate({ date, heureDebut: hd, heureFin: hf, objet: objet || undefined });
    setObjet('');
  };

  return (
    <Card className="p-0">
      <div className="p-5 pb-2"><CardTitle>Planning du studio</CardTitle></div>
      <ul className="divide-y divide-surface-border">
        {reservations.map((r) => (
          <li key={r.id} className="px-5 py-2.5 text-sm">
            <div className="font-medium text-ink">{r.date} · {r.heureDebut}–{r.heureFin}</div>
            <div className="text-xs text-ink-subtle">{r.objet ?? r.productionTitre ?? 'Réservé'}</div>
          </li>
        ))}
        {reservations.length === 0 && <li className="px-5 py-4 text-sm text-ink-subtle">Aucun créneau.</li>}
      </ul>
      <form onSubmit={onReserve} className="space-y-2 border-t border-surface-border p-4">
        <Input id="rdate" type="date" label="Date" value={date} onChange={(e) => setDate(e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <Input id="hd" type="time" label="De" value={hd} onChange={(e) => setHd(e.target.value)} />
          <Input id="hf" type="time" label="À" value={hf} onChange={(e) => setHf(e.target.value)} />
        </div>
        <Input id="objet" label="Objet" value={objet} onChange={(e) => setObjet(e.target.value)} />
        <Button type="submit" size="sm" className="w-full" loading={reserver.isPending} disabled={!date}><CalendarPlus size={14} /> Réserver</Button>
      </form>
    </Card>
  );
}
