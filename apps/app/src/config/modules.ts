import {
  LayoutDashboard,
  Users,
  FolderArchive,
  CalendarClock,
  FileBarChart,
  Bell,
  Briefcase,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';

export interface ModuleRoute {
  path: string;
  label: string;
  icon: LucideIcon;
  /** Permission requise pour voir l'entrée (le wildcard `*` la satisfait toujours). */
  requires?: string;
}

/** Modules DrwinDesk (cf. document maître, partie IV). `requires` filtre la nav. */
export const MODULES: ModuleRoute[] = [
  { path: '/', label: 'Tableau de bord', icon: LayoutDashboard },
  { path: '/rh', label: 'RH & Personnel', icon: Users },
  { path: '/documents', label: 'Documents & Contrats', icon: FolderArchive },
  { path: '/presences', label: 'Présences & Congés', icon: CalendarClock },
  { path: '/rapports', label: 'Rapports', icon: FileBarChart },
  { path: '/recrutement', label: 'Recrutement', icon: Briefcase, requires: 'recrutement:read' },
  { path: '/utilisateurs', label: 'Utilisateurs & accès', icon: ShieldCheck, requires: 'user:read' },
  { path: '/alertes', label: 'Alertes', icon: Bell },
];
