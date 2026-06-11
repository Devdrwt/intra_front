import { CalendarDays, Clock, Coffee, LogIn, LogOut, Play, Timer } from 'lucide-react';
import { Badge, Button, Card, CardTitle, EmptyState, Skeleton, cn } from '@drwindesk/ui';
import type { Pointage } from '@/features/presences/types';
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
const diff = (a?: string, b?: string): number | null => {
  const x = toMin(a);
  const y = toMin(b);
  return x == null || y == null ? null : Math.max(0, y - x);
};
/** Durée travaillée nette (sortie − entrée − pause). */
const workedMin = (p?: Pointage): number | null => {
  const base = diff(p?.heureEntree, p?.heureSortie);
  if (base == null) return null;
  return Math.max(0, base - (diff(p?.heurePauseDebut, p?.heurePauseFin) ?? 0));
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
  const p = list.find((x) => x.date === today());
  const hasEntree = Boolean(p?.heureEntree);
  const hasSortie = Boolean(p?.heureSortie);
  const onBreak = Boolean(p?.heurePauseDebut) && !p?.heurePauseFin;
  const todayDur = workedMin(p);

  const ym = today().slice(0, 7);
  const month = list.filter((x) => x.date.startsWith(ym));
  const daysWorked = month.filter((x) => x.heureEntree).length;
  const totalMin = month.reduce((s, x) => s + (workedMin(x) ?? 0), 0);
  const avgMin = daysWorked ? Math.round(totalMin / daysWorked) : 0;

  const status = !hasEntree
    ? { label: 'Pas encore pointé', tone: 'warning' as const }
    : onBreak
      ? { label: 'En pause', tone: 'warning' as const }
      : !hasSortie
        ? { label: 'En cours', tone: 'brand' as const }
        : { label: 'Journée terminée', tone: 'success' as const };

  const loading = (s: string) => pointer.isPending && pointer.variables === s;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-ink">Mon pointage</h2>
        <p className="text-ink-muted">Entrée, pause, reprise et sortie — suivez votre temps.</p>
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

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <Time label="Entrée" value={p?.heureEntree} />
          <Time label="Pause" value={p?.heurePauseDebut} />
          <Time label="Reprise" value={p?.heurePauseFin} />
          <Time label="Sortie" value={p?.heureSortie} />
          <Time label="Travaillé" value={todayDur != null ? fmtDur(todayDur) : undefined} strong />
        </div>

        <div className="mt-5 flex flex-wrap gap-2 border-t border-surface-border pt-4">
          <Button variant="secondary" disabled={hasEntree} loading={loading('ENTREE')} onClick={() => pointer.mutate('ENTREE')}>
            <LogIn size={16} /> Entrée
          </Button>
          <Button
            variant="secondary"
            disabled={!hasEntree || onBreak || Boolean(p?.heurePauseDebut) || hasSortie}
            loading={loading('PAUSE')}
            onClick={() => pointer.mutate('PAUSE')}
          >
            <Coffee size={16} /> Pause
          </Button>
          <Button variant="secondary" disabled={!onBreak} loading={loading('REPRISE')} onClick={() => pointer.mutate('REPRISE')}>
            <Play size={16} /> Reprise
          </Button>
          <Button disabled={!hasEntree || hasSortie || onBreak} loading={loading('SORTIE')} onClick={() => pointer.mutate('SORTIE')}>
            <LogOut size={16} /> Sortie
          </Button>
        </div>
        <p className="mt-2 text-xs text-ink-subtle">La pause est facultative : vous pouvez sortir sans l’avoir pointée.</p>
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
            {list.map((x) => (
              <li key={x.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <span className="font-medium capitalize text-ink">{fmtDate(x.date)}</span>
                <span className="flex items-center gap-2 text-ink-muted sm:gap-3">
                  <Badge tone={x.heureEntree ? 'success' : 'neutral'}>E {x.heureEntree ?? '—'}</Badge>
                  {(x.heurePauseDebut || x.heurePauseFin) && (
                    <Badge tone="neutral">
                      Pause {x.heurePauseDebut ?? '—'}–{x.heurePauseFin ?? '—'}
                    </Badge>
                  )}
                  <Badge tone={x.heureSortie ? 'success' : 'neutral'}>S {x.heureSortie ?? '—'}</Badge>
                  <span className={cn('w-14 text-right font-medium', workedMin(x) ? 'text-ink' : 'text-ink-subtle')}>
                    {fmtDur(workedMin(x))}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Time({ label, value, strong }: { label: string; value?: string; strong?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">{label}</p>
      <p className={cn('text-xl font-bold', strong ? 'text-brand-600' : 'text-ink')}>{value ?? '—'}</p>
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
