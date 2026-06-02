export type NotificationSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

/** Réponse backend (espaces/notification.entity.ts → NotificationDto). */
export interface Notification {
  id: string;
  kind: string;
  severity: NotificationSeverity;
  title: string;
  body?: string;
  data?: unknown;
  read: boolean;
  createdAt: string; // ISO
}

/** Réponse de GET /espaces/moi (tableau de bord personnel). */
export interface EspaceMoi {
  user: { id: string; email: string; roles: string[] };
  notifications: { unread: number; recent: Notification[] };
}

export const SEVERITY_LABEL: Record<NotificationSeverity, string> = {
  INFO: 'Info',
  WARNING: 'Avertissement',
  CRITICAL: 'Critique',
};
