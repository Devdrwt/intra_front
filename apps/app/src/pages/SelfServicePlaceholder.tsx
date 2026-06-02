import { Construction } from 'lucide-react';
import { Card, EmptyState } from '@drwindesk/ui';

/**
 * Écran de l'espace collaborateur en attente des endpoints « self » du backend
 * (GET/POST /me/...). Voir docs/contracts/espace-collaborateur.md.
 */
export function SelfServicePlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-ink">{title}</h2>
        <p className="text-ink-muted">{description}</p>
      </header>
      <Card className="p-0">
        <EmptyState
          icon={<Construction size={22} />}
          title="Bientôt disponible"
          description="Cet écran de votre espace personnel se branchera sur vos propres données dès que le backend exposera les endpoints « /me/… »."
        />
      </Card>
    </div>
  );
}
