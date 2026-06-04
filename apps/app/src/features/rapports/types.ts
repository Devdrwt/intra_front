export type StatutRapport = 'BROUILLON' | 'SOUMIS';

/** Métadonnées de pièce jointe (clé interne non exposée). */
export interface AttachmentMeta {
  name: string;
  size: number;
  type: string;
}

/** Réponse backend (rapport.entity.ts → RapportDto). */
export interface Rapport {
  id: string;
  employeId: string;
  date: string; // yyyy-mm-dd
  contenu: string;
  statut: StatutRapport;
  submittedAt?: string; // ISO
  attachment?: AttachmentMeta;
}

/** Référence renvoyée par l'upload d'une pièce jointe. */
export interface AttachmentRef {
  key: string;
  name: string;
  size: number;
  type: string;
}

/** Corps de PUT /rapports (UpsertRapportDto). */
export interface RapportInput {
  employeId: string;
  date?: string;
  contenu: string;
  statut?: StatutRapport;
  attachmentKey?: string;
  attachmentName?: string;
  attachmentSize?: number;
  attachmentType?: string;
}

export interface RapportFilters {
  date?: string;
  employeId?: string;
  statut?: StatutRapport | '';
}

export type GroupBy = 'service' | 'departement';

export interface ConsolidationQuery {
  from: string;
  to: string;
  groupBy: GroupBy;
}

/** Ligne de consolidation (rapport.entity.ts → ConsolidationLigne). */
export interface ConsolidationLigne {
  groupe: string;
  employesActifs: number;
  rapportsSoumis: number;
  joursPeriode: number;
  /** Taux 0..1 = rapportsSoumis / (employesActifs * joursPeriode). */
  taux: number;
}

export interface CheckMissingResult {
  date: string;
  manquants: number;
}

export const STATUT_RAPPORT_LABEL: Record<StatutRapport, string> = {
  BROUILLON: 'Brouillon',
  SOUMIS: 'Soumis',
};

export const STATUT_RAPPORT_OPTIONS = (
  Object.keys(STATUT_RAPPORT_LABEL) as StatutRapport[]
).map((value) => ({ value, label: STATUT_RAPPORT_LABEL[value] }));
