import { api } from '@/lib/api';
import type { Annonce, CreateAnnonceInput } from './types';

export const actualitesService = {
  list: () => api.get<Annonce[]>('/annonces').then((r) => r.data),
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
