import { api } from '@/lib/api';

export interface KbArticle {
  id: string;
  titre: string;
  contenu: string;
  categorie?: string;
  tags: string[];
  publie: boolean;
  authorId?: string;
  createdAt: string;
  updatedAt: string;
}
export interface KbInput {
  titre: string;
  contenu: string;
  categorie?: string;
  tags?: string[];
  publie?: boolean;
}

export const kbService = {
  list: (q?: string, categorie?: string) =>
    api.get<KbArticle[]>('/kb', { params: { q: q || undefined, categorie: categorie || undefined } }).then((r) => r.data),
  create: (input: KbInput) => api.post<KbArticle>('/kb', input).then((r) => r.data),
  update: (id: string, input: Partial<KbInput>) => api.patch<KbArticle>(`/kb/${id}`, input).then((r) => r.data),
  remove: (id: string) => api.delete(`/kb/${id}`).then(() => undefined),
};
