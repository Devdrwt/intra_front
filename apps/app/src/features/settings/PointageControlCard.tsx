import { useEffect, useState } from 'react';
import { MapPin, ShieldCheck } from 'lucide-react';
import { Button, Card, CardDescription, CardTitle, Input, cn } from '@drwindesk/ui';
import { getCoords } from '@/lib/geo';
import { toast } from '@/lib/toast';
import { useOrgSettings, useUpdatePointage, type PointageControl } from './org';

const EMPTY: PointageControl = {
  officeLat: null,
  officeLng: null,
  radiusM: 200,
  geoRequired: false,
  strictWindow: false,
};

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-6 w-11 items-center rounded-full p-0.5 transition-colors',
        on ? 'justify-end bg-brand-600' : 'justify-start bg-surface-border',
      )}
    >
      <span className="h-5 w-5 rounded-full bg-white shadow" />
    </button>
  );
}

export function PointageControlCard() {
  const { data: org } = useOrgSettings();
  const update = useUpdatePointage();
  const [p, setP] = useState<PointageControl>(EMPTY);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (org?.pointage) setP(org.pointage);
  }, [org]);

  const useMyPosition = async () => {
    setLocating(true);
    const c = await getCoords();
    setLocating(false);
    if (!c) return toast.error('Position indisponible — autorisez la géolocalisation.');
    setP((s) => ({ ...s, officeLat: Number(c.lat.toFixed(6)), officeLng: Number(c.lng.toFixed(6)) }));
  };

  return (
    <Card>
      <div className="flex items-center gap-2">
        <ShieldCheck size={18} className="text-ink-subtle" />
        <CardTitle>Contrôle du pointage</CardTitle>
      </div>
      <CardDescription>
        Fiabilise le pointage : géolocalisation, zone de travail et plage horaire.
      </CardDescription>

      <div className="mt-4 space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-ink">Lieu de travail (géofence)</span>
            <Button variant="secondary" size="sm" onClick={() => void useMyPosition()} loading={locating}>
              <MapPin size={15} /> Utiliser ma position
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              type="number"
              label="Latitude"
              value={p.officeLat ?? ''}
              onChange={(e) => setP((s) => ({ ...s, officeLat: e.target.value ? Number(e.target.value) : null }))}
            />
            <Input
              type="number"
              label="Longitude"
              value={p.officeLng ?? ''}
              onChange={(e) => setP((s) => ({ ...s, officeLng: e.target.value ? Number(e.target.value) : null }))}
            />
            <Input
              type="number"
              label="Rayon (m)"
              value={p.radiusM}
              onChange={(e) => setP((s) => ({ ...s, radiusM: Number(e.target.value) || 0 }))}
            />
          </div>
          <p className="mt-1 text-xs text-ink-subtle">
            Les pointages hors de ce rayon sont <strong>signalés</strong> (pas bloqués).
          </p>
        </div>

        <label className="flex items-center justify-between gap-3">
          <span className="text-sm text-ink">
            Géolocalisation obligatoire
            <span className="block text-xs text-ink-subtle">Refuse un pointage sans position GPS.</span>
          </span>
          <Toggle on={p.geoRequired} onClick={() => setP((s) => ({ ...s, geoRequired: !s.geoRequired }))} />
        </label>

        <label className="flex items-center justify-between gap-3">
          <span className="text-sm text-ink">
            Plage horaire stricte
            <span className="block text-xs text-ink-subtle">
              N'autorise le pointage qu'autour des horaires de travail.
            </span>
          </span>
          <Toggle on={p.strictWindow} onClick={() => setP((s) => ({ ...s, strictWindow: !s.strictWindow }))} />
        </label>

        <div className="flex justify-end">
          <Button onClick={() => update.mutate(p)} loading={update.isPending}>
            Enregistrer
          </Button>
        </div>
      </div>
    </Card>
  );
}
