import type { BadgeProps } from '@drwindesk/ui';
import type { NotificationSeverity } from './types';

const TONE: Record<NotificationSeverity, NonNullable<BadgeProps['tone']>> = {
  INFO: 'brand',
  WARNING: 'warning',
  CRITICAL: 'danger',
};

export function severityTone(s: NotificationSeverity): NonNullable<BadgeProps['tone']> {
  return TONE[s];
}

const DOT: Record<NotificationSeverity, string> = {
  INFO: 'bg-brand-500',
  WARNING: 'bg-warning',
  CRITICAL: 'bg-danger',
};

export function severityDot(s: NotificationSeverity): string {
  return DOT[s];
}

/** Temps relatif court en français (il y a 5 min, 2 h, 3 j…). */
export function timeAgo(iso: string, now: number = Date.now()): string {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const j = Math.floor(h / 24);
  return `il y a ${j} j`;
}
