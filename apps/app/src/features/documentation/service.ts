import { api } from '@/lib/api';
import { triggerDownload } from '@/lib/download';
import type { CreateDocInput, DocItem } from './types';

export const documentationService = {
  list: (categorie?: string, q?: string) =>
    api.get<DocItem[]>('/docs', { params: { categorie: categorie || undefined, q: q || undefined } }).then((r) => r.data),
  create: (input: CreateDocInput) => {
    const fd = new FormData();
    fd.append('titre', input.titre);
    if (input.description) fd.append('description', input.description);
    if (input.categorie) fd.append('categorie', input.categorie);
    fd.append('file', input.file);
    return api.post<DocItem>('/docs', fd).then((r) => r.data);
  },
  remove: (id: string) => api.delete(`/docs/${id}`).then(() => undefined),
  download: (id: string, name: string) =>
    api.get(`/docs/${id}/file`, { responseType: 'blob' }).then((r) => triggerDownload(r.data, name)),
};
