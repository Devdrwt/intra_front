import { Link } from 'react-router-dom';
import {
  Bell,
  Briefcase,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  Command,
  FileBarChart,
  FolderArchive,
  FolderKanban,
  Sparkles,
  LifeBuoy,
  Calculator,
  Boxes,
  Target,
  Award,
  GraduationCap,
  Megaphone,
  Clapperboard,
  Gauge,
  Smartphone,
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
      'Onglet « Pointage » : entrée, pause, reprise et sortie du jour (la pause est facultative).',
      'Onglet « Demandes » : permissions, repos et congés — déposez puis approuvez ou refusez.',
      'Onglet « Missions » (RH) : déclarez une période de mission → présence présumée, sans pointage ni alerte.',
      'Onglet « Suivi » : repérez les pointages « hors zone » et les retards sur une période.',
      'Selon le réglage admin, le pointage peut exiger la géolocalisation et rester dans la plage horaire.',
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
      'Activez/désactivez un compte ou ajustez ses rôles — dont « Personnel de solution » (espace réduit).',
      'Bouton « Accès aux modules » : ouvrez à la carte Finance, Studio, Appels d’offres, Archivage… pour une personne.',
    ],
  },
  {
    to: '/alertes',
    icon: Bell,
    tone: 'warning',
    title: 'Alertes',
    steps: [
      'Retrouvez toutes vos notifications ; marquez-les lues une à une ou toutes à la fois.',
      'Dans Paramètres → Notifications : activez les notifications push (mobile/bureau, même app fermée) et le son à la réception.',
    ],
  },

  // --- Nouveautés -----------------------------------------------------------
  {
    to: '/agenda',
    icon: CalendarDays,
    tone: 'brand',
    title: 'Mon agenda',
    steps: [
      'Trois vues : Mois (titres dans les cases), Semaine (créneaux par jour) et Agenda (liste à venir).',
      'Créez vos rendez-vous et réunions ; « Aujourd’hui » recadre la vue.',
      'Congés, formations, studio et échéances s’y affichent automatiquement (par couleur).',
      'Bouton « iCal » pour le voir dans Google Agenda / Outlook / votre téléphone.',
    ],
  },
  {
    to: '/mes-validations',
    icon: ClipboardCheck,
    tone: 'success',
    title: 'Mes validations',
    steps: [
      'Onglet « À valider » : approuvez ou rejetez congés, frais, achats au même endroit.',
      'Onglet « Mes demandes » : suivez l’avancement de vos propres demandes (timeline).',
    ],
  },
  {
    to: '/mes-taches',
    icon: FolderKanban,
    tone: 'brand',
    title: 'Mes tâches (Kanban)',
    steps: [
      'Tableau À faire → En cours → En revue → Terminé.',
      'Ajoutez une tâche, fixez la priorité, faites-la avancer d’un clic.',
    ],
  },
  {
    to: '/assistant',
    icon: Sparkles,
    tone: 'brand',
    title: 'Assistant IA',
    steps: [
      'Onglet « Générer » : choisissez un modèle (contrat, attestation, rapport…).',
      'Pour un contrat/attestation, sélectionnez l’employé : le document est pré-rempli.',
      'Onglet « Assistant » : posez vos questions. Tout reste un brouillon à valider.',
    ],
  },
  {
    to: '/support',
    icon: LifeBuoy,
    tone: 'warning',
    title: 'Support / Helpdesk',
    steps: [
      'Ouvrez un ticket (incident, demande d’accès, moyens généraux).',
      'Suivez son statut, échangez en commentaires, surveillez le délai (SLA).',
    ],
  },
  {
    to: '/finance/tiers',
    icon: Calculator,
    tone: 'success',
    title: 'Finance & Gestion',
    steps: [
      'Tiers (clients/fournisseurs), notes de frais, factures client, trésorerie.',
      'Paie (bulletins), budgets et tableau de bord, comptabilité.',
      'Exportez les écritures pour le cabinet (CSV / SYSCOHADA).',
    ],
  },
  {
    to: '/finance/inventaire',
    icon: Boxes,
    tone: 'warning',
    title: 'Inventaire & immobilisations',
    steps: [
      'Recensez le matériel de l’entreprise (informatique, mobilier, véhicules…).',
      'État, valeur, localisation, affectation ; totaux du patrimoine par catégorie.',
    ],
  },
  {
    to: '/evaluation',
    icon: Target,
    tone: 'brand',
    title: 'Évaluation & OKR',
    steps: [
      'Suivez les objectifs (OKR) et leurs résultats clés.',
      'Gérez les campagnes d’évaluation.',
    ],
  },
  {
    to: '/performance',
    icon: Award,
    tone: 'success',
    title: 'Performance & recommandation',
    steps: [
      'Score basé sur le travail réel : rapports, missions, présence, OKR.',
      'Rédigez la recommandation — ou laissez l’IA la pré-rédiger.',
    ],
  },
  {
    to: '/onboarding',
    icon: Rocket,
    tone: 'brand',
    title: 'Onboarding / Offboarding',
    steps: [
      'Parcours d’arrivée et de départ ; chaque étape est une tâche assignée.',
      'Cochez les étapes au fur et à mesure ; suivez l’avancement.',
    ],
  },
  {
    to: '/formation',
    icon: GraduationCap,
    tone: 'success',
    title: 'Formation',
    steps: [
      'Parcourez le catalogue et demandez une formation (validée par le moteur).',
      'Suivez vos demandes et vos compétences.',
    ],
  },
  {
    to: '/appels-offres',
    icon: Megaphone,
    tone: 'warning',
    title: 'Appels d’offres',
    steps: [
      'Veille des avis (AAO) : décidez « on y va » ou « on passe ».',
      'Préparez le dossier (DAO), soumettez, suivez le résultat. (Géré par le secrétariat.)',
    ],
  },
  {
    to: '/studio',
    icon: Clapperboard,
    tone: 'brand',
    title: 'Studio',
    steps: [
      'Suivez les productions (podcasts, vidéos, enregistrements) de l’idée à la publication.',
      'Réservez un créneau du studio dans le planning.',
    ],
  },
  {
    to: '/cockpit',
    icon: Gauge,
    tone: 'danger',
    title: 'Cockpit direction',
    steps: [
      'Vue consolidée : trésorerie, résultat, créances, effectif, support.',
      'Suivi des budgets en un coup d’œil.',
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
              <li className="flex gap-2">
                <Step n={4} /> Sur mobile, installez l’app (« Ajouter à l’écran d’accueil »){' '}
                <Smartphone size={13} className="inline" /> et utilisez l’
                <Link to="/accueil-rapide" className="font-medium text-brand-600 hover:underline">
                  Accueil rapide
                </Link>{' '}
                pour pointer / demander hors-ligne.
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
