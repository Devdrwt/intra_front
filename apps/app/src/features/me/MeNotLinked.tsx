import { UserX } from 'lucide-react';
import { Card, EmptyState } from '@drwindesk/ui';

/**
 * Affiché quand le compte connecté n'est rattaché à aucune fiche employé
 * (les endpoints /me/... renvoient alors une erreur). Le rattachement se fait
 * côté RH (invitation depuis la fiche) ou par email — voir le contrat backend.
 */
export function MeNotLinked() {
  return (
    <Card className="p-0">
      <EmptyState
        icon={<UserX size={22} />}
        title="Compte non rattaché à une fiche"
        description="Votre compte n’est associé à aucune fiche collaborateur. Contactez les ressources humaines pour relier votre accès à votre dossier."
        className="py-12"
      />
    </Card>
  );
}
