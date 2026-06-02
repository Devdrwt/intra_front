import {
  LayoutDashboard,
  Users,
  FolderArchive,
  CalendarClock,
  FileBarChart,
  Bell,
  Briefcase,
  ShieldCheck,
  BookOpen,
  HelpCircle,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface ModuleRoute {
  path: string;
  label: string;
  icon: LucideIcon;
  /** Groupe d'affichage dans la sidebar. */
  group: string;
  /** Permission requise pour voir l'entrée (le wildcard `*` la satisfait toujours). */
  requires?: string;
}

/** Ordre des groupes dans la sidebar. */
export const MODULE_GROUPS = [
  'Principal',
  'Personnel',
  'Activité',
  'Administration',
  'Aide & réglages',
] as const;

/** Modules DrwinDesk (cf. document maître, partie IV). `requires` filtre la nav. */
export const MODULES: ModuleRoute[] = [
  { path: '/', label: 'Tableau de bord', icon: LayoutDashboard, group: 'Principal' },
  { path: '/rh', label: 'RH & Personnel', icon: Users, group: 'Personnel' },
  { path: '/presences', label: 'Présences & Congés', icon: CalendarClock, group: 'Personnel' },
  { path: '/documents', label: 'Documents & Contrats', icon: FolderArchive, group: 'Personnel' },
  { path: '/rapports', label: 'Rapports', icon: FileBarChart, group: 'Activité' },
  { path: '/alertes', label: 'Alertes', icon: Bell, group: 'Activité' },
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
  { path: '/guide', label: 'Guide', icon: BookOpen, group: 'Aide & réglages' },
  { path: '/faq', label: 'FAQ', icon: HelpCircle, group: 'Aide & réglages' },
  { path: '/parametres', label: 'Paramètres', icon: Settings, group: 'Aide & réglages' },
];
