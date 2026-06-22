export interface DocItem {
  id: string;
  titre: string;
  description: string | null;
  categorie: string;
  mimeType: string;
  taille: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocInput {
  titre: string;
  description?: string;
  categorie?: string;
  file: File;
}

export const DOC_CATEGORIES = [
  'Procédures',
  'Manuels',
  'Contrats',
  'Politiques',
  'Rapports',
  'Autres',
] as const;
