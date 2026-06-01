import type { BadgeProps } from '@drwindesk/ui';
import type { Employe, StatutEmploye } from './types';

export function fullName(e: Pick<Employe, 'prenom' | 'nom'>): string {
  return `${e.prenom} ${e.nom}`;
}

export function initials(e: Pick<Employe, 'prenom' | 'nom'>): string {
  return `${e.prenom[0] ?? ''}${e.nom[0] ?? ''}`.toUpperCase();
}

const STATUT_TONE: Record<StatutEmploye, NonNullable<BadgeProps['tone']>> = {
  ACTIF: 'success',
  CONGE: 'brand',
  SUSPENDU: 'warning',
  SORTI: 'neutral',
};

const STATUT_LABEL: Record<StatutEmploye, string> = {
  ACTIF: 'Actif',
  CONGE: 'En congé',
  SUSPENDU: 'Suspendu',
  SORTI: 'Sorti',
};

export function statutTone(s: StatutEmploye): NonNullable<BadgeProps['tone']> {
  return STATUT_TONE[s];
}
export function statutLabel(s: StatutEmploye): string {
  return STATUT_LABEL[s];
}

export function formatDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Nombre de jours avant la fin de contrat (négatif si dépassé), ou null. */
export function joursAvantEcheance(dateFinContrat?: string, today = new Date()): number | null {
  if (!dateFinContrat) return null;
  const fin = new Date(dateFinContrat);
  if (Number.isNaN(fin.getTime())) return null;
  const ms = fin.getTime() - today.setHours(0, 0, 0, 0);
  return Math.round(ms / 86_400_000);
}
