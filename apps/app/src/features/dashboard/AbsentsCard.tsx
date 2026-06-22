import { Link } from 'react-router-dom';
import { Plane } from 'lucide-react';
import { Avatar, Badge, Card, CardTitle, Skeleton } from '@drwindesk/ui';
import { avatarUrl } from '@/lib/avatar';
import { useAbsents } from '@/features/annuaire/hooks';
import type { Absent } from '@/features/annuaire/types';

const fullName = (p: Absent) => `${p.prenom} ${p.nom}`.trim();
const photo = (p: Absent) => (p.userId ? avatarUrl(p.userId, p.hasAvatar) : undefined);
const MOTIF_TONE: Record<string, 'success' | 'brand' | 'warning'> = {
  Congé: 'success',
  Permission: 'brand',
  Mission: 'warning',
};

/** Qui est absent aujourd'hui (congé / permission / mission). */
export function AbsentsCard() {
  const { data, isLoading } = useAbsents();

  return (
    <Card>
      <div className="flex items-center justify-between">
        <CardTitle>Absents aujourd’hui</CardTitle>
        <Link to="/annuaire" className="text-sm font-medium text-brand-600 hover:underline">
          Annuaire
        </Link>
      </div>

      {isLoading ? (
        <div className="mt-4 space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-9 rounded-lg" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-ink-muted">
          <Plane size={16} className="text-ink-subtle" /> Tout le monde est là aujourd’hui 🎉
        </p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {data.map((p, i) => (
            <li key={i} className="flex items-center gap-3 rounded-lg px-1.5 py-1">
              <Avatar name={fullName(p)} src={photo(p)} size="sm" />
              <span className="min-w-0 flex-1 truncate text-sm text-ink">{fullName(p)}</span>
              <Badge tone={MOTIF_TONE[p.motif] ?? 'neutral'}>{p.motif}</Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
