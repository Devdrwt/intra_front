import { Link } from 'react-router-dom';
import { Cake, PartyPopper } from 'lucide-react';
import { Avatar, Card, CardTitle } from '@drwindesk/ui';
import { avatarUrl } from '@/lib/avatar';
import { useTempsForts } from '@/features/annuaire/hooks';
import type { PersonneBrief } from '@/features/annuaire/types';

const fullName = (p: PersonneBrief) => `${p.prenom} ${p.nom}`.trim();
const photo = (p: PersonneBrief) => (p.userId ? avatarUrl(p.userId, p.hasAvatar) : undefined);

/** Temps forts : anniversaires d'ancienneté + arrivées récentes. */
export function TempsFortsCard() {
  const { data } = useTempsForts();
  if (!data || (data.arrivees.length === 0 && data.anniversaires.length === 0)) return null;

  return (
    <Card className="bg-gradient-to-br from-amber-400/10 to-transparent">
      <CardTitle>Temps forts</CardTitle>
      <div className="mt-3 space-y-2.5">
        {data.anniversaires.map((p) => (
          <div key={`a-${p.prenom}-${p.nom}`} className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <Cake size={16} />
            </span>
            <p className="min-w-0 text-sm text-ink">
              <span className="font-semibold">{fullName(p)}</span> fête {p.annees} an{p.annees > 1 ? 's' : ''} chez nous 🎉
            </p>
          </div>
        ))}
        {data.arrivees.map((p) => (
          <div key={`n-${p.prenom}-${p.nom}`} className="flex items-center gap-3">
            <Avatar name={fullName(p)} src={photo(p)} size="sm" />
            <p className="min-w-0 truncate text-sm text-ink">
              <PartyPopper size={13} className="mr-1 inline text-brand-500" />
              Bienvenue à <span className="font-semibold">{fullName(p)}</span> · {p.poste}
            </p>
          </div>
        ))}
      </div>
      <Link to="/annuaire" className="mt-3 inline-block text-sm font-medium text-brand-600 hover:underline">
        Voir l’annuaire
      </Link>
    </Card>
  );
}
