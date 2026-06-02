import Link from 'next/link';
import { Button, Card, CardTitle, CardDescription } from '@drwindesk/ui';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3002';

const piliers = [
  {
    title: 'RH & Contrats',
    desc: 'Fiches collaborateurs, prestataires, échéances de contrat avec alertes automatiques.',
  },
  {
    title: 'Présences & Congés',
    desc: 'Pointage web/mobile, demandes de congés, soldes calculés automatiquement.',
  },
  {
    title: 'Reporting',
    desc: 'Rapport journalier consolidé en hebdo puis mensuel, jusqu’à la direction.',
  },
];

export default function HomePage() {
  return (
    <main>
      <header className="border-b border-surface-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold text-ink">
            Drwin<span className="text-brand-600">Desk</span>
          </span>
          <nav className="flex items-center gap-3">
            <Link href="/contact">
              <Button variant="ghost" size="sm">
                Contact
              </Button>
            </Link>
            <Link href="/candidat">
              <Button variant="ghost" size="sm">
                Espace candidat
              </Button>
            </Link>
            <a href={APP_URL}>
              <Button size="sm">Espace collaborateur</Button>
            </a>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-sm font-medium uppercase tracking-wide text-brand-600">
          Intranet · ERP · SIRH
        </p>
        <h1 className="mt-3 max-w-2xl text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          De la vision à l’exécution.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-ink-muted">
          Centraliser ce qui était dispersé, automatiser ce qui était répétitif. Une seule
          plateforme pour le personnel, les documents, les présences et le reporting.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href={APP_URL}>
            <Button size="lg">Accéder à mon espace</Button>
          </a>
          <Link href="/candidat">
            <Button variant="secondary" size="lg">
              Déposer ma candidature
            </Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-5 sm:grid-cols-3">
          {piliers.map((p) => (
            <Card key={p.title}>
              <CardTitle>{p.title}</CardTitle>
              <CardDescription>{p.desc}</CardDescription>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t border-surface-border">
        <div className="mx-auto max-w-6xl px-6 py-6 text-sm text-ink-subtle">
          © {new Date().getFullYear()} Drwintech SaaS Solutions — DrwinDesk
        </div>
      </footer>
    </main>
  );
}
