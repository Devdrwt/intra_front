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
  restricted: boolean;
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

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';
/** URL d'aperçu inline (PDF/image) d'un document, chargeable dans le navigateur. */
export const docPreviewUrl = (id: string) => `${API_BASE}/docs/${id}/file?inline=1`;
/** Vrai si le type permet un aperçu intégré (PDF ou image). */
export const isPreviewable = (mime: string) => mime === 'application/pdf' || mime.startsWith('image/');
