import {
  LayoutDashboard,
  Users,
  FolderArchive,
  CalendarClock,
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
export const MODULE_GROUPS = ['Mon espace', 'Administration', 'Aide & réglages'] as const;

export const MODULES: ModuleRoute[] = [
  // --- Mon espace (collaborateur) -------------------------------------------
  { path: '/', label: 'Tableau de bord', icon: LayoutDashboard, group: 'Mon espace' },
  { path: '/mon-pointage', label: 'Mon pointage', icon: Clock, group: 'Mon espace' },
  { path: '/mes-conges', label: 'Mes congés', icon: CalendarClock, group: 'Mon espace' },
  { path: '/mes-rapports', label: 'Mes rapports', icon: FileBarChart, group: 'Mon espace' },
  { path: '/mes-documents', label: 'Mes documents', icon: FolderArchive, group: 'Mon espace' },
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
    path: '/documents',
    label: 'Documents (GED)',
    icon: FolderArchive,
    group: 'Administration',
    requires: 'rh.employe:read',
  },
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
  {
    path: '/parametres',
    label: 'Paramètres',
    icon: Settings,
    group: 'Administration',
    requires: 'settings:manage',
  },

  // --- Aide & réglages -------------------------------------------------------
  { path: '/guide', label: 'Guide', icon: BookOpen, group: 'Aide & réglages' },
  { path: '/faq', label: 'FAQ', icon: HelpCircle, group: 'Aide & réglages' },
];
