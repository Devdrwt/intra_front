import {
  LayoutDashboard,
  Users,
  FolderArchive,
  CalendarClock,
  CalendarDays,
  CalendarCheck,
  FileBarChart,
  Bell,
  Briefcase,
  ShieldCheck,
  BookOpen,
  HelpCircle,
  Settings,
  Clock,
  Activity,
  FolderKanban,
  MessagesSquare,
  Mail,
  ClipboardCheck,
  LifeBuoy,
  Building2,
  Calculator,
  Receipt,
  FileText,
  Wallet,
  Landmark,
  PiggyBank,
  Target,
  Rocket,
  GraduationCap,
  Gauge,
  Sparkles,
  Archive,
  Megaphone,
  Clapperboard,
  Boxes,
  Library,
  LineChart,
  Award,
  Images,
  Newspaper,
  type LucideIcon,
} from 'lucide-react';

export interface ModuleRoute {
  path: string;
  label: string;
  icon: LucideIcon;
  /** Espace d'appartenance (= section de la sidebar). */
  group: string;
  /** Permission requise pour voir l'entrée (le wildcard `*` la satisfait toujours). */
  requires?: string;
}

/**
 * Deux espaces :
 *  - « Mon espace » : self-service, visible par tout utilisateur connecté.
 *  - « Administration » : gestion org-wide, réservée par permission (admin / RH-manager).
 *  - « Aide & réglages » : transverse.
 */
export const MODULE_GROUPS = ['Mon espace', 'Administration', 'Finance', 'Aide & réglages'] as const;

export const MODULES: ModuleRoute[] = [
  // --- Mon espace (collaborateur) -------------------------------------------
  { path: '/', label: 'Tableau de bord', icon: LayoutDashboard, group: 'Mon espace' },
  { path: '/actualites', label: 'Actualités', icon: Newspaper, group: 'Mon espace' },
  { path: '/mon-pointage', label: 'Mon pointage', icon: Clock, group: 'Mon espace' },
  { path: '/agenda', label: 'Mon agenda', icon: CalendarDays, group: 'Mon espace' },
  { path: '/mes-demandes', label: 'Mes demandes', icon: CalendarClock, group: 'Mon espace' },
  {
    path: '/mes-validations',
    label: 'Mes validations',
    icon: ClipboardCheck,
    group: 'Mon espace',
    requires: 'approval:read',
  },
  { path: '/mes-taches', label: 'Mes tâches', icon: FolderKanban, group: 'Mon espace' },
  { path: '/mes-rapports', label: 'Mes rapports', icon: FileBarChart, group: 'Mon espace' },
  { path: '/mes-documents', label: 'Mes documents', icon: FolderArchive, group: 'Mon espace' },
  { path: '/mes-projets', label: 'Mes projets', icon: FolderKanban, group: 'Mon espace' },
  { path: '/bibliotheque', label: 'Bibliothèque', icon: Library, group: 'Mon espace' },
  { path: '/assistant', label: 'Assistant IA', icon: Sparkles, group: 'Mon espace', requires: 'ai:use' },
  { path: '/discussion', label: 'Discussion', icon: MessagesSquare, group: 'Mon espace' },
  { path: '/mail', label: 'Mail', icon: Mail, group: 'Mon espace' },
  { path: '/alertes', label: 'Mes alertes', icon: Bell, group: 'Mon espace' },

  // --- Administration (gestion) ---------------------------------------------
  {
    path: '/rh',
    label: 'RH & Personnel',
    icon: Users,
    group: 'Administration',
    requires: 'rh.employe:read',
  },
  {
    path: '/presences',
    label: 'Présences & Congés',
    icon: CalendarCheck,
    group: 'Administration',
    requires: 'presence:manage',
  },
  {
    path: '/rapports',
    label: 'Rapports',
    icon: FileBarChart,
    group: 'Administration',
    requires: 'rapport:manage',
  },
  {
    path: '/projets',
    label: 'Projets',
    icon: FolderKanban,
    group: 'Administration',
    requires: 'project:read',
  },
  {
    path: '/support',
    label: 'Support',
    icon: LifeBuoy,
    group: 'Administration',
    requires: 'support:read',
  },
  {
    path: '/documents',
    label: 'Documents (GED)',
    icon: FolderArchive,
    group: 'Administration',
    requires: 'rh.employe:read',
  },
  { path: '/archivage', label: 'Archivage', icon: Archive, group: 'Administration', requires: 'ged.archive:read' },
  { path: '/mediatheque', label: 'Médiathèque', icon: Images, group: 'Administration', requires: 'media:read' },
  {
    path: '/recrutement',
    label: 'Recrutement',
    icon: Briefcase,
    group: 'Administration',
    requires: 'recrutement:read',
  },
  {
    path: '/utilisateurs',
    label: 'Utilisateurs & accès',
    icon: ShieldCheck,
    group: 'Administration',
    requires: 'user:read',
  },
  {
    path: '/activite',
    label: 'Activité',
    icon: Activity,
    group: 'Administration',
    requires: 'audit:read',
  },
  { path: '/appels-offres', label: 'Appels d\'offres', icon: Megaphone, group: 'Administration', requires: 'commercial:read' },
  { path: '/studio', label: 'Studio', icon: Clapperboard, group: 'Administration', requires: 'studio:read' },
  { path: '/evaluation', label: 'Évaluation & OKR', icon: Target, group: 'Administration', requires: 'rh.eval:read' },
  { path: '/performance', label: 'Performance', icon: Award, group: 'Administration', requires: 'rh.eval:read' },
  { path: '/onboarding', label: 'Onboarding', icon: Rocket, group: 'Administration', requires: 'rh.onboarding:read' },
  { path: '/formation', label: 'Formation', icon: GraduationCap, group: 'Administration', requires: 'rh.formation:read' },

  // --- Finance & Gestion -----------------------------------------------------
  { path: '/finance/tiers', label: 'Tiers', icon: Building2, group: 'Finance', requires: 'finance:read' },
  { path: '/finance/frais', label: 'Notes de frais', icon: Receipt, group: 'Finance', requires: 'finance:read' },
  { path: '/finance/achats', label: 'Achats', icon: FileText, group: 'Finance', requires: 'finance:read' },
  { path: '/finance/factures', label: 'Factures client', icon: FileText, group: 'Finance', requires: 'finance:read' },
  { path: '/finance/tresorerie', label: 'Trésorerie', icon: Wallet, group: 'Finance', requires: 'finance:read' },
  { path: '/finance/inventaire', label: 'Inventaire', icon: Boxes, group: 'Finance', requires: 'finance:read' },
  { path: '/finance/paie', label: 'Paie', icon: Landmark, group: 'Finance', requires: 'finance:manage' },
  { path: '/finance/budgets', label: 'Budgets & pilotage', icon: PiggyBank, group: 'Finance', requires: 'finance:read' },
  { path: '/finance/rentabilite', label: 'Rentabilité projets', icon: LineChart, group: 'Finance', requires: 'finance:read' },
  { path: '/finance/comptabilite', label: 'Comptabilité', icon: Calculator, group: 'Finance', requires: 'finance:manage' },
  { path: '/cockpit', label: 'Cockpit direction', icon: Gauge, group: 'Finance', requires: 'direction:read' },

  // --- Aide & réglages (tout utilisateur) -----------------------------------
  // Paramètres = self-service (profil, mot de passe, messagerie, thème) ; la
  // section « Organisation » à l'intérieur reste réservée aux admins.
  { path: '/parametres', label: 'Paramètres', icon: Settings, group: 'Aide & réglages' },
  { path: '/guide', label: 'Guide', icon: BookOpen, group: 'Aide & réglages' },
  { path: '/faq', label: 'FAQ', icon: HelpCircle, group: 'Aide & réglages' },
];
