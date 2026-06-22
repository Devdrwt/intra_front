export type MediaCollectionType = 'GALERIE' | 'IDENTITE';
export type MediaType = 'IMAGE' | 'VIDEO';

export interface MediaCollection {
  id: string;
  nom: string;
  description: string | null;
  type: MediaCollectionType;
  itemsCount: number;
  coverItemId: string | null;
  createdAt: string;
}

export interface MediaItem {
  id: string;
  collectionId: string;
  nom: string;
  type: MediaType;
  mimeType: string;
  taille: number;
  createdAt: string;
}

export interface CreateCollectionInput {
  nom: string;
  description?: string;
  type?: MediaCollectionType;
}

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';
/** URL directe du fichier (cookie de session envoyé automatiquement avec <img>/<video>). */
export function mediaFileUrl(itemId: string): string {
  return `${API_BASE}/media/items/${itemId}/file`;
}
