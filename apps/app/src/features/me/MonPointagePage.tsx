import { LogIn, LogOut, Clock, CalendarDays, Timer } from 'lucide-react';
import { Badge, Button, Card, CardTitle, EmptyState, Skeleton, cn } from '@drwindesk/ui';
import { useMePointer, useMyPointages } from './hooks';
import { MeNotLinked } from './MeNotLinked';

const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });

const toMin = (hhmm?: string): number | null => {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':');
  return Number(h ?? 0) * 60 + Number(m ?? 0);
};
const durMin = (entree?: string, sortie?: string): number | null => {
  const a = toMin(entree);
  const b = toMin(sortie);
  return a == null || b == null ? null : Math.max(0, b - a);
};
const fmtDur = (min: number | null): string => {
  if (min == null || min === 0) return '—';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
};

export function MonPointagePage() {
  const { data: pointages, isLoading, error } = useMyPointages();
  const pointer = useMePointer();

  if (error) return <MeNotLinked />;

  const list = pointages ?? [];
  const todayP = list.find((p) => p.date === today());
  const hasEntree = Boolean(todayP?.heureEntree);
  const hasSortie = Boolean(todayP?.heureSortie);
  const todayDur = durMin(todayP?.heureEntree, todayP?.heureSortie);

  const ym = today().slice(0, 7);
  const month = list.filter((p) => p.date.startsWith(ym));
  const daysWorked = month.filter((p) => p.heureEntree).length;
  const totalMin = month.reduce((s, p) => s + (durMin(p.heureEntree, p.heureSortie) ?? 0), 0);
  const avgMin = daysWorked ? Math.round(totalMin / daysWorked) : 0;

  const status = !hasEntree
    ? { label: 'Pas encore pointé', tone: 'warning' as const }
    : !hasSortie
      ? { label: 'En cours', tone: 'brand' as const }
      : { label: 'Journée terminée', tone: 'success' as const };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-ink">Mon pointage</h2>
        <p className="text-ink-muted">Pointez vos arrivées et départs, suivez votre temps.</p>
      </header>

      {/* Aujourd'hui */}
      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>Aujourd’hui</CardTitle>
          <Badge tone={status.tone} dot>
            {status.label}
            {todayDur != null && status.tone === 'success' ? ` · ${fmtDur(todayDur)}` : ''}
          </Badge>
        </div>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">Entrée</p>
              <p className="text-2xl font-bold text-ink">{todayP?.heureEntree ?? '—'}</p>
            </div>
            <div className="h-10 w-px bg-surface-border" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">Sortie</p>
              <p className="text-2xl font-bold text-ink">{todayP?.heureSortie ?? '—'}</p>
            </div>
            {todayDur != null && (
              <>
                <div className="h-10 w-px bg-surface-border" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">Durée</p>
                  <p className="text-2xl font-bold text-ink">{fmtDur(todayDur)}</p>
                </div>
              </>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              disabled={hasEntree}
              loading={pointer.isPending && pointer.variables === 'ENTREE'}
              onClick={() => pointer.mutate('ENTREE')}
            >
              <LogIn size={16} /> Pointer l’entrée
            </Button>
            <Button
              disabled={!hasEntree || hasSortie}
              loading={pointer.isPending && pointer.variables === 'SORTIE'}
              onClick={() => pointer.mutate('SORTIE')}
            >
              <LogOut size={16} /> Pointer la sortie
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats du mois */}
      <div className="grid gap-4 sm:grid-cols-3">
        <MiniStat icon={CalendarDays} label="Jours pointés (ce mois)" value={String(daysWorked)} />
        <MiniStat icon={Timer} label="Heures cumulées" value={fmtDur(totalMin)} />
        <MiniStat icon={Clock} label="Moyenne / jour" value={fmtDur(avgMin)} />
      </div>

      {/* Historique */}
      <Card className="p-0">
        <div className="p-5 pb-0">
          <CardTitle>Historique récent</CardTitle>
        </div>
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <EmptyState
            icon={<Clock size={20} />}
            title="Aucun pointage"
            description="Vos pointages apparaîtront ici."
            className="py-10"
          />
        ) : (
          <ul className="mt-3 divide-y divide-surface-border">
            {list.map((p) => {
              const d = durMin(p.heureEntree, p.heureSortie);
              return (
                <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <span className="font-medium capitalize text-ink">{fmtDate(p.date)}</span>
                  <span className="flex items-center gap-2 text-ink-muted sm:gap-3">
                    <Badge tone={p.heureEntree ? 'success' : 'neutral'}>
                      Entrée {p.heureEntree ?? '—'}
                    </Badge>
                    <Badge tone={p.heureSortie ? 'success' : 'neutral'}>
                      Sortie {p.heureSortie ?? '—'}
                    </Badge>
                    <span className={cn('w-14 text-right font-medium', d ? 'text-ink' : 'text-ink-subtle')}>
                      {fmtDur(d)}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <Card className="flex items-center gap-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-soft-fg">
        <Icon size={20} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">{label}</p>
        <p className="text-xl font-bold text-ink">{value}</p>
      </div>
    </Card>
  );
}
