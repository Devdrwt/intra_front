export type AnnonceCategorie = 'ACTUALITE' | 'RH' | 'EVENEMENT';

export interface Annonce {
  id: string;
  titre: string;
  contenu: string;
  categorie: AnnonceCategorie;
  epingle: boolean;
  hasCover: boolean;
  authorId: string | null;
  authorNom?: string;
  likeCount: number;
  clapCount: number;
  myReactions: ReactionType[];
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export type ReactionType = 'LIKE' | 'CLAP';

export interface AnnonceComment {
  id: string;
  annonceId: string;
  authorId: string;
  authorNom?: string;
  contenu: string;
  createdAt: string;
}

export interface CreateAnnonceInput {
  titre: string;
  contenu: string;
  categorie?: AnnonceCategorie;
  epingle?: boolean;
  cover?: File;
}

export const CATEGORIE_META: Record<
  AnnonceCategorie,
  { label: string; tone: 'brand' | 'success' | 'warning' }
> = {
  ACTUALITE: { label: 'Actualité', tone: 'brand' },
  RH: { label: 'RH', tone: 'success' },
  EVENEMENT: { label: 'Événement', tone: 'warning' },
};

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';
/** URL de l'image de couverture (cookie de session envoyé avec <img>). */
export function annonceCoverUrl(id: string): string {
  return `${API_BASE}/annonces/${id}/cover`;
}
