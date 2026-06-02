import { Link } from 'react-router-dom';
import {
  Bell,
  Briefcase,
  CalendarClock,
  Command,
  FileBarChart,
  FolderArchive,
  Rocket,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardTitle, cn } from '@drwindesk/ui';

interface Section {
  to: string;
  icon: LucideIcon;
  tone: 'brand' | 'success' | 'warning' | 'danger';
  title: string;
  steps: string[];
}

const TONE: Record<Section['tone'], string> = {
  brand: 'bg-brand-soft text-brand-soft-fg',
  success: 'bg-success-soft text-success-soft-fg',
  warning: 'bg-warning-soft text-warning-soft-fg',
  danger: 'bg-danger-soft text-danger-soft-fg',
};

const SECTIONS: Section[] = [
  {
    to: '/rh',
    icon: Users,
    tone: 'brand',
    title: 'RH & Personnel',
    steps: [
      'Cliquez sur « Nouvel employé » pour créer une fiche.',
      'Recherchez et filtrez par département ou statut.',
      'Ouvrez une fiche pour voir les détails, l’échéance de contrat et les documents.',
    ],
  },
  {
    to: '/presences',
    icon: CalendarClock,
    tone: 'success',
    title: 'Présences & Congés',
    steps: [
      'Onglet « Pointage » : enregistrez les entrées et sorties du jour.',
      'Onglet « Congés » : créez une demande, puis approuvez ou refusez.',
    ],
  },
  {
    to: '/rapports',
    icon: FileBarChart,
    tone: 'brand',
    title: 'Rapports',
    steps: [
      'Saisissez votre rapport journalier (brouillon ou soumis).',
      'Consultez la consolidation par service ou département.',
      'Les administrateurs peuvent contrôler les rapports non remis.',
    ],
  },
  {
    to: '/documents',
    icon: FolderArchive,
    tone: 'warning',
    title: 'Documents & Contrats',
    steps: [
      'Sélectionnez un collaborateur à gauche.',
      'Consultez et ajoutez ses contrats, bulletins et attestations.',
    ],
  },
  {
    to: '/recrutement',
    icon: Briefcase,
    tone: 'brand',
    title: 'Recrutement',
    steps: [
      'Suivez les candidatures déposées depuis le site public.',
      'Faites évoluer leur statut et traitez les messages de contact.',
    ],
  },
  {
    to: '/utilisateurs',
    icon: ShieldCheck,
    tone: 'danger',
    title: 'Utilisateurs & accès',
    steps: [
      'Invitez un membre par email (il reçoit un lien pour définir son mot de passe).',
      'Activez/désactivez un compte ou ajustez ses rôles.',
    ],
  },
  {
    to: '/alertes',
    icon: Bell,
    tone: 'warning',
    title: 'Alertes',
    steps: [
      'Retrouvez toutes vos notifications.',
      'Marquez-les comme lues individuellement ou toutes à la fois.',
    ],
  },
];

export function GuidePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-ink">Guide d’utilisation</h2>
        <p className="text-ink-muted">Prenez DrwinDesk en main module par module.</p>
      </header>

      {/* Premiers pas */}
      <Card className="bg-gradient-to-br from-brand-soft to-surface">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Rocket size={20} />
          </span>
          <div>
            <CardTitle>Premiers pas</CardTitle>
            <ol className="mt-3 space-y-2 text-sm text-ink-muted">
              <li className="flex gap-2">
                <Step n={1} /> Parcourez les modules depuis la barre latérale.
              </li>
              <li className="flex gap-2">
                <Step n={2} /> Utilisez la recherche{' '}
                <kbd className="rounded-md border border-surface-border bg-surface px-1.5 text-[11px]">
                  ⌘K
                </kbd>{' '}
                <Command size={13} className="inline" /> pour aller partout instantanément.
              </li>
              <li className="flex gap-2">
                <Step n={3} /> Réglez l’apparence (clair/sombre) dans{' '}
                <Link to="/parametres" className="font-medium text-brand-600 hover:underline">
                  Paramètres
                </Link>
                .
              </li>
            </ol>
          </div>
        </div>
      </Card>

      {/* Modules */}
      <div className="grid gap-5 md:grid-cols-2">
        {SECTIONS.map((s) => (
          <Card key={s.to} interactive>
            <div className="flex items-center gap-3">
              <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl', TONE[s.tone])}>
                <s.icon size={18} />
              </span>
              <Link to={s.to} className="font-semibold text-ink hover:text-brand-600">
                {s.title}
              </Link>
            </div>
            <ul className="mt-3 space-y-2">
              {s.steps.map((step, i) => (
                <li key={i} className="flex gap-2 text-sm text-ink-muted">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  {step}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Step({ n }: { n: number }) {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[11px] font-semibold text-white">
      {n}
    </span>
  );
}
