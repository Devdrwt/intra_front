export type DocStatut = 'BROUILLON' | 'EN_REVUE' | 'PUBLIE';

export interface DocItem {
  id: string;
  titre: string;
  description: string | null;
  categorie: string;
  statut: DocStatut;
  mimeType: string;
  taille: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export const DOC_STATUT_META: Record<DocStatut, { label: string; tone: 'warning' | 'brand' | 'success' }> = {
  BROUILLON: { label: 'Brouillon', tone: 'warning' },
  EN_REVUE: { label: 'En revue', tone: 'brand' },
  PUBLIE: { label: 'Publié', tone: 'success' },
};

export interface CreateDocInput {
  titre: string;
  description?: string;
  categorie?: string;
  file: File;
}

export interface DocVersion {
  id: string;
  version: number;
  taille: number;
  mimeType: string;
  note: string | null;
  createdBy: string | null;
  createdAt: string;
}

export const DOC_CATEGORIES = [
  'Procédures',
  'Manuels',
  'Contrats',
  'Politiques',
  'Rapports',
  'Autres',
] as const;
