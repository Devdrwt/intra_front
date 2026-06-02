import type { Metadata } from 'next';
import Link from 'next/link';
import { CandidatureForm } from './CandidatureForm';

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
        Déposez votre candidature. Vous recevrez une confirmation par email.
      </p>

      <CandidatureForm />
    </main>
  );
}
