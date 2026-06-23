import { api } from '@/lib/api';
import type { Annonce, AnnonceComment, CreateAnnonceInput, ReactionType } from './types';

export const actualitesService = {
  list: () => api.get<Annonce[]>('/annonces').then((r) => r.data),
  toggleReaction: (id: string, type: ReactionType) =>
    api.post<{ active: boolean }>(`/annonces/${id}/reactions/${type}`).then((r) => r.data),
  markRead: (id: string) => api.post(`/annonces/${id}/read`).then(() => undefined),
  comments: (id: string) =>
    api.get<AnnonceComment[]>(`/annonces/${id}/comments`).then((r) => r.data),
  addComment: (id: string, contenu: string) =>
    api.post<AnnonceComment>(`/annonces/${id}/comments`, { contenu }).then((r) => r.data),
  removeComment: (commentId: string) =>
    api.delete(`/annonces/comments/${commentId}`).then(() => undefined),
  create: (input: CreateAnnonceInput) => {
    const fd = new FormData();
    fd.append('titre', input.titre);
    fd.append('contenu', input.contenu);
    if (input.categorie) fd.append('categorie', input.categorie);
    if (input.epingle != null) fd.append('epingle', String(input.epingle));
    if (input.cover) fd.append('cover', input.cover);
    return api.post<Annonce>('/annonces', fd).then((r) => r.data);
  },
  update: (id: string, patch: Partial<Pick<Annonce, 'titre' | 'contenu' | 'epingle'>>) =>
    api.patch<Annonce>(`/annonces/${id}`, patch).then((r) => r.data),
  remove: (id: string) => api.delete(`/annonces/${id}`).then(() => undefined),
};
