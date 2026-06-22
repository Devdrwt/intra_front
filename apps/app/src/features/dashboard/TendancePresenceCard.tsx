import { Card, CardTitle, Skeleton } from '@drwindesk/ui';
import { useTendancePresence } from '@/features/presences/hooks';

const W = 260;
const H = 60;
const weekday = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { weekday: 'narrow' });

/** Mini-courbe réelle de la présence sur 7 jours (managers/RH). */
export function TendancePresenceCard() {
  const { data, isLoading } = useTendancePresence();

  if (isLoading) {
    return (
      <Card>
        <CardTitle>Présence (7 jours)</CardTitle>
        <Skeleton className="mt-3 h-16 w-full rounded-lg" />
      </Card>
    );
  }
  if (!data || data.length < 2) return null;

  const pts = data.map((d) => (d.total ? (d.present / d.total) * 100 : 0));
  const last = Math.round(pts[pts.length - 1] ?? 0);
  const step = W / (pts.length - 1);
  const xy = (p: number, i: number) => `${(i * step).toFixed(1)},${(H - (p / 100) * H).toFixed(1)}`;
  const line = pts.map(xy).join(' ');
  const area = `0,${H} ${line} ${W},${H}`;
  const lastY = H - ((pts[pts.length - 1] ?? 0) / 100) * H;

  return (
    <Card>
      <div className="flex items-center justify-between">
        <CardTitle>Présence (7 jours)</CardTitle>
        <span className="text-lg font-bold text-ink">{last}%</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full" preserveAspectRatio="none" height={H}>
        <polyline points={area} className="fill-brand-500/15" />
        <polyline
          points={line}
          className="fill-none stroke-brand-600"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={W} cy={lastY} r={3.5} className="fill-brand-600" />
      </svg>
      <div className="mt-1 flex justify-between text-[10px] uppercase text-ink-subtle">
        {data.map((d) => (
          <span key={d.date}>{weekday(d.date)}</span>
        ))}
      </div>
    </Card>
  );
}
