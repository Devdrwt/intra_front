import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Pin } from 'lucide-react';
import { Badge, Button, Card, Skeleton } from '@drwindesk/ui';
import { useAnnonces } from './hooks';
import { CATEGORIE_META, annonceCoverUrl } from './types';

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

export function ActualiteDetailPage() {
  const { id } = useParams();
  const { data, isLoading } = useAnnonces();
  const a = (data ?? []).find((x) => x.id === id);

  if (isLoading) return <Skeleton className="h-96 w-full rounded-2xl" />;

  if (!a) {
    return (
      <Card className="p-8 text-center">
        <p className="text-ink-muted">Actualité introuvable.</p>
        <Link to="/actualites">
          <Button variant="secondary" className="mt-4">
            <ArrowLeft size={16} /> Retour aux actualités
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link to="/actualites" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft size={16} /> Toutes les actualités
      </Link>
      <Card className="overflow-hidden p-0">
        {a.hasCover && (
          <img src={annonceCoverUrl(a.id)} alt={a.titre} className="max-h-96 w-full object-cover" />
        )}
        <div className="p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={CATEGORIE_META[a.categorie].tone}>{CATEGORIE_META[a.categorie].label}</Badge>
            {a.epingle && (
              <Badge tone="neutral">
                <Pin size={12} /> Épinglé
              </Badge>
            )}
            <span className="text-xs text-ink-subtle">
              {fmt(a.createdAt)}
              {a.authorNom ? ` · par ${a.authorNom}` : ''}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-ink">{a.titre}</h1>
          <div className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-ink-muted">{a.contenu}</div>
        </div>
      </Card>
    </div>
  );
}
