import { Card, CardDescription, CardTitle } from '@drwindesk/ui';

export function ModulePlaceholder({ title }: { title: string }) {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-ink">{title}</h1>
      <Card>
        <CardTitle>Module à construire</CardTitle>
        <CardDescription>
          Squelette en place. Étapes : modèle de données ↔ endpoints NestJS, liste + filtres,
          formulaire de création/édition, vues détail.
        </CardDescription>
      </Card>
    </div>
  );
}
