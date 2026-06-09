// --- Finance : recettes (cf. docs/contracts/finance-recettes.md) ---------------

export type StatutFactureClient =
  | 'BROUILLON'
  | 'EMISE'
  | 'PARTIELLEMENT_PAYEE'
  | 'PAYEE'
  | 'ANNULEE';

export interface FactureClient {
  id: string;
  reference: string; // FC-2026-0001 (n° légal à l'émission)
  clientNom: string;
  objet: string;
  statut: StatutFactureClient;
  dateFacture: string;
  dateEcheance?: string;
  montantHt: number;
  montantTva: number;
  montantTtc: number;
  montantPaye: number;
}

export interface FactureClientInput {
  clientId: string;
  clientNom: string;
  objet: string;
  montantHt: number;
  dateEcheance?: string;
}

export interface EncaissementInput {
  montant: number;
  mode: string;
  paiementRef?: string;
}

export const STATUT_FC_LABEL: Record<StatutFactureClient, string> = {
  BROUILLON: 'Brouillon',
  EMISE: 'Émise',
  PARTIELLEMENT_PAYEE: 'Partiellement payée',
  PAYEE: 'Payée',
  ANNULEE: 'Annulée',
};
