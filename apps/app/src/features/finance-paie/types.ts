// --- Finance : paie (cf. docs/contracts/finance-paie.md) -----------------------

export type StatutPeriode = 'BROUILLON' | 'VALIDEE' | 'PAYEE' | 'CLOTUREE';
export type StatutBulletin = 'BROUILLON' | 'VALIDE' | 'PAYE';

export interface PeriodePaie {
  id: string;
  annee: number;
  mois: number; // 1..12
  statut: StatutPeriode;
  nbBulletins: number;
  totalNet: number;
}

export interface BulletinPaie {
  id: string;
  periodeId: string;
  employeNom: string;
  salaireBrut: number;
  totalRetenues: number;
  netAPayer: number;
  chargesPatronales: number;
  statut: StatutBulletin;
  paiementRef?: string;
}

export const STATUT_PERIODE_LABEL: Record<StatutPeriode, string> = {
  BROUILLON: 'Brouillon',
  VALIDEE: 'Validée',
  PAYEE: 'Payée',
  CLOTUREE: 'Clôturée',
};

export const STATUT_BULLETIN_LABEL: Record<StatutBulletin, string> = {
  BROUILLON: 'Brouillon',
  VALIDE: 'Validé',
  PAYE: 'Payé',
};

export const MOIS_LABEL = [
  '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
