// --- Pointage -----------------------------------------------------------------
export interface Pointage {
  id: string;
  employeId: string;
  date: string; // ISO yyyy-mm-dd
  heureEntree?: string; // HH:mm
  heureSortie?: string; // HH:mm
}

// --- Congés -------------------------------------------------------------------
export type TypeConge = 'ANNUEL' | 'MALADIE' | 'SANS_SOLDE' | 'EXCEPTIONNEL';
export type StatutConge = 'EN_ATTENTE' | 'APPROUVE' | 'REFUSE';

export interface DemandeConge {
  id: string;
  employeId: string;
  type: TypeConge;
  dateDebut: string; // ISO
  dateFin: string; // ISO
  motif?: string;
  statut: StatutConge;
  demandeLe: string; // ISO
}

export type DemandeCongeInput = Pick<
  DemandeConge,
  'employeId' | 'type' | 'dateDebut' | 'dateFin' | 'motif'
>;

export const TYPE_CONGE_LABEL: Record<TypeConge, string> = {
  ANNUEL: 'Congé annuel',
  MALADIE: 'Maladie',
  SANS_SOLDE: 'Sans solde',
  EXCEPTIONNEL: 'Exceptionnel',
};

export const TYPE_CONGE_OPTIONS = (Object.keys(TYPE_CONGE_LABEL) as TypeConge[]).map((value) => ({
  value,
  label: TYPE_CONGE_LABEL[value],
}));

export const STATUT_CONGE_LABEL: Record<StatutConge, string> = {
  EN_ATTENTE: 'En attente',
  APPROUVE: 'Approuvé',
  REFUSE: 'Refusé',
};

/** Nombre de jours calendaires inclus entre deux dates ISO. */
export function nbJours(dateDebut: string, dateFin: string): number {
  const d1 = new Date(dateDebut);
  const d2 = new Date(dateFin);
  if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) return 0;
  return Math.max(0, Math.round((d2.getTime() - d1.getTime()) / 86_400_000) + 1);
}
