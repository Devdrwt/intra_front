// --- Finance : trésorerie (cf. docs/contracts/finance-tresorerie.md) -----------

export type TypeCompteTresorerie = 'CAISSE' | 'BANQUE' | 'MOBILE_MONEY';
export type SensMouvement = 'ENTREE' | 'SORTIE';

export interface CompteTresorerie {
  id: string;
  type: TypeCompteTresorerie;
  nom: string;
  compteCode: string;
  numero?: string;
  solde: number; // dérivé
}

export interface MouvementTresorerie {
  id: string;
  compteId: string;
  date: string;
  sens: SensMouvement;
  montant: number;
  libelle: string;
  mode: string;
  paiementRef?: string;
  rapproche: boolean;
  sourceType: string;
}

export interface MouvementInput {
  compteId: string;
  sens: SensMouvement;
  montant: number;
  libelle: string;
  mode: string;
  paiementRef?: string;
}

export const TYPE_COMPTE_LABEL: Record<TypeCompteTresorerie, string> = {
  CAISSE: 'Caisse',
  BANQUE: 'Banque',
  MOBILE_MONEY: 'Mobile Money',
};
