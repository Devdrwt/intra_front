import { Link } from 'react-router-dom';
import { ArrowRight, Pin } from 'lucide-react';
import { Badge, Card } from '@drwindesk/ui';
import { useAnnonces } from './hooks';
import { CATEGORIE_META, annonceCoverUrl } from './types';

/** Carte « À la une » : l'actualité phare (épinglée / la plus récente). */
export function AlaUneCard() {
  const { data } = useAnnonces();
  const a = (data ?? [])[0];
  if (!a) return null;

  const excerpt = a.contenu.length > 150 ? `${a.contenu.slice(0, 150)}…` : a.contenu;

  return (
    <Link to="/actualites" className="block">
      <Card interactive className="overflow-hidden p-0">
        <div className="relative">
          {a.hasCover ? (
            <img src={annonceCoverUrl(a.id)} alt="" className="h-48 w-full object-cover" loading="lazy" />
          ) : (
            <div className="h-48 w-full bg-gradient-to-br from-brand-500 to-brand-700" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/20 to-transparent" />

          <div className="absolute left-4 top-4 flex items-center gap-1.5">
            <Badge tone={CATEGORIE_META[a.categorie].tone}>{CATEGORIE_META[a.categorie].label}</Badge>
            <span className="inline-flex items-center gap-1 rounded-full bg-ink/40 px-2 py-0.5 text-xs font-medium text-white backdrop-blur">
              {a.epingle && <Pin size={11} />} À la une
            </span>
          </div>

          <div className="absolute inset-x-0 bottom-0 p-4">
            <h3 className="text-lg font-semibold text-white drop-shadow-sm">{a.titre}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-white/85">{excerpt}</p>
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-2.5 text-sm">
          <span className="text-ink-subtle">Actualités de l’entreprise</span>
          <span className="inline-flex items-center gap-1 font-medium text-brand-600">
            Lire <ArrowRight size={14} />
          </span>
        </div>
      </Card>
    </Link>
  );
}
