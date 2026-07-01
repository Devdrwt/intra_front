/** Types d'entités pouvant recevoir une pièce jointe (miroir du backend). */
export type PieceEntityType =
  | 'TIERS'
  | 'FACTURE_CLIENT'
  | 'FACTURE_FOURNISSEUR'
  | 'MOUVEMENT_TRESORERIE'
  | 'BIEN'
  | 'BULLETIN_PAIE';

export interface PieceJointe {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  label: string | null;
  uploadedById: string | null;
  createdAt: string;
}
