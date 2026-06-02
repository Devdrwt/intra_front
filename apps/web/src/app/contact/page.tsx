import type { Metadata } from 'next';
import Link from 'next/link';
import { ContactForm } from './ContactForm';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contactez Drwintech — questions, partenariats, devis.',
};

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/" className="text-sm text-brand-600 hover:underline">
        ← Retour
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-ink">Contact</h1>
      <p className="mt-2 text-ink-muted">
        Une question, un projet ? Écrivez-nous, nous répondons rapidement.
      </p>

      <ContactForm />
    </main>
  );
}
