import {
  LayoutDashboard,
  Users,
  FolderArchive,
  CalendarClock,
  FileBarChart,
  Bell,
  type LucideIcon,
} from 'lucide-react';

export interface ModuleRoute {
  path: string;
  label: string;
  icon: LucideIcon;
}

/** Les 7 modules DrwinDesk (cf. document maître, partie IV). */
export const MODULES: ModuleRoute[] = [
  { path: '/', label: 'Tableau de bord', icon: LayoutDashboard },
  { path: '/rh', label: 'RH & Personnel', icon: Users },
  { path: '/documents', label: 'Documents & Contrats', icon: FolderArchive },
  { path: '/presences', label: 'Présences & Congés', icon: CalendarClock },
  { path: '/rapports', label: 'Rapports', icon: FileBarChart },
  { path: '/alertes', label: 'Alertes', icon: Bell },
];
