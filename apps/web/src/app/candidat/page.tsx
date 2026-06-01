import type { Metadata } from 'next';
import Link from 'next/link';
import { Button, Card, CardTitle, CardDescription, Input } from '@drwindesk/ui';

export const metadata: Metadata = {
  title: 'Espace candidat',
  description: 'Déposez votre candidature et suivez son avancement chez Drwintech.',
};

export default function CandidatPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/" className="text-sm text-brand-600 hover:underline">
        ← Retour
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-ink">Espace candidat</h1>
      <p className="mt-2 text-ink-muted">
        Déposez votre CV. Vous recevrez un lien de suivi de votre candidature par email.
      </p>

      <Card className="mt-8">
        <CardTitle>Votre candidature</CardTitle>
        <CardDescription>Les champs marqués d’un * sont obligatoires.</CardDescription>
        {/* TODO: brancher sur POST /candidatures (API NestJS) + upload S3 du CV */}
        <form className="mt-5 flex flex-col gap-4">
          <Input id="nom" label="Nom complet *" placeholder="Aïcha Kossou" required />
          <Input id="email" type="email" label="Email *" placeholder="vous@exemple.com" required />
          <Input id="poste" label="Poste visé" placeholder="Développeur·se full-stack" />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cv" className="text-sm font-medium text-ink">
              CV (PDF) *
            </label>
            <input
              id="cv"
              type="file"
              accept="application/pdf"
              className="text-sm text-ink-muted file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700"
              required
            />
          </div>
          <Button type="submit" className="mt-2 self-start">
            Envoyer ma candidature
          </Button>
        </form>
      </Card>
    </main>
  );
}
