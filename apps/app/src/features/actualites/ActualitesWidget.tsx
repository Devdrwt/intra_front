import { Link } from 'react-router-dom';
import { Megaphone, Pin } from 'lucide-react';
import { Badge, Card, CardTitle, EmptyState, Skeleton } from '@drwindesk/ui';
import { useAnnonces } from './hooks';
import { CATEGORIE_META, annonceCoverUrl } from './types';

const short = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

/** Aperçu des dernières actualités pour le tableau de bord. */
export function ActualitesWidget() {
  const { data, isLoading } = useAnnonces();
  const items = (data ?? []).slice(0, 4);

  return (
    <Card>
      <div className="flex items-center justify-between">
        <CardTitle>Actualités</CardTitle>
        <Link to="/actualites" className="text-sm font-medium text-brand-600 hover:underline">
          Voir tout
        </Link>
      </div>

      {isLoading ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={<Megaphone size={20} />} title="Aucune actualité" className="py-8" />
      ) : (
        <ul className="mt-3 divide-y divide-surface-border">
          {items.map((a) => (
            <li key={a.id}>
              <Link to="/actualites" className="flex items-center gap-3 py-3 transition-colors hover:opacity-80">
                {a.hasCover ? (
                  <img src={annonceCoverUrl(a.id)} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" loading="lazy" />
                ) : (
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-ink-subtle">
                    <Megaphone size={18} />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Badge tone={CATEGORIE_META[a.categorie].tone}>{CATEGORIE_META[a.categorie].label}</Badge>
                    {a.epingle && <Pin size={12} className="text-ink-subtle" />}
                  </div>
                  <p className="mt-0.5 truncate text-sm font-medium text-ink">{a.titre}</p>
                </div>
                <span className="shrink-0 text-xs text-ink-subtle">{short(a.createdAt)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
