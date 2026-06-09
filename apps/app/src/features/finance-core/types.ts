// --- Cœur financier (cf. docs/contracts/finance-core.md) -----------------------

export type TiersType = 'CLIENT' | 'FOURNISSEUR' | 'LES_DEUX';

export interface Tiers {
  id: string;
  type: TiersType;
  code: string; // "CL-0001" / "FO-0001"
  nom: string;
  ifu?: string;
  rccm?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  compteCode?: string;
  actif: boolean;
}

export type TiersInput = Omit<Tiers, 'id' | 'code' | 'actif'> & { actif?: boolean };

export interface CompteComptable {
  id: string;
  code: string;
  libelle: string;
  classe: string; // "1".."8"
  actif: boolean;
}

export interface JournalComptable {
  id: string;
  code: string; // AC, VE, BQ, CA, OD, PA
  libelle: string;
  type: string;
}

export interface Taxe {
  id: string;
  code: string; // TVA18, EXO, AIB
  libelle: string;
  taux: number; // %
  compteCode?: string;
  actif: boolean;
}

export interface ExerciceComptable {
  id: string;
  annee: number;
  debut: string;
  fin: string;
  cloture: boolean;
}

export const TIERS_TYPE_LABEL: Record<TiersType, string> = {
  CLIENT: 'Client',
  FOURNISSEUR: 'Fournisseur',
  LES_DEUX: 'Client & fournisseur',
};

export const TIERS_TYPE_OPTIONS = (Object.keys(TIERS_TYPE_LABEL) as TiersType[]).map((value) => ({
  value,
  label: TIERS_TYPE_LABEL[value],
}));

export type ExportFormat = 'csv' | 'fec' | 'syscohada';
