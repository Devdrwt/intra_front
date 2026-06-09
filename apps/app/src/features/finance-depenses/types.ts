// --- Finance : dépenses (cf. docs/contracts/finance-depenses.md) ---------------

export type StatutNoteFrais = 'BROUILLON' | 'SOUMISE' | 'APPROUVEE' | 'REJETEE' | 'REMBOURSEE';
export type ModePaiement = 'ESPECES' | 'VIREMENT' | 'MOBILE_MONEY' | 'CHEQUE';

export interface NoteDeFrais {
  id: string;
  reference: string; // NF-2026-0001
  titre: string;
  statut: StatutNoteFrais;
  montantHt: number;
  montantTva: number;
  montantTtc: number;
  modePaiement?: ModePaiement;
  paiementRef?: string;
  createdAt: string;
}
export interface NoteDeFraisInput {
  titre: string;
  montantHt: number;
  montantTva?: number;
}

export type StatutFactureFourn = 'A_PAYER' | 'PARTIELLEMENT_PAYEE' | 'PAYEE';

export interface FactureFournisseur {
  id: string;
  reference: string; // FF-2026-0001
  numeroFournisseur?: string;
  fournisseurNom: string;
  dateFacture: string;
  dateEcheance?: string;
  montantTtc: number;
  montantPaye: number;
  statut: StatutFactureFourn;
}

export const STATUT_NF_LABEL: Record<StatutNoteFrais, string> = {
  BROUILLON: 'Brouillon',
  SOUMISE: 'Soumise',
  APPROUVEE: 'Approuvée',
  REJETEE: 'Rejetée',
  REMBOURSEE: 'Remboursée',
};

export const STATUT_FF_LABEL: Record<StatutFactureFourn, string> = {
  A_PAYER: 'À payer',
  PARTIELLEMENT_PAYEE: 'Partiellement payée',
  PAYEE: 'Payée',
};

export const MODE_PAIEMENT_OPTIONS = [
  { value: 'MOBILE_MONEY', label: 'Mobile Money' },
  { value: 'VIREMENT', label: 'Virement' },
  { value: 'ESPECES', label: 'Espèces' },
  { value: 'CHEQUE', label: 'Chèque' },
];
