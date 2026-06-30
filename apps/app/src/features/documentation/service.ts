import { api } from '@/lib/api';
import { triggerDownload } from '@/lib/download';
import type { CreateDocInput, DocItem, DocStatut, DocVersion } from './types';

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
  setStatut: (id: string, statut: DocStatut) =>
    api.patch<DocItem>(`/docs/${id}/statut`, { statut }).then((r) => r.data),
  remove: (id: string) => api.delete(`/docs/${id}`).then(() => undefined),
  download: (id: string, name: string) =>
    api.get(`/docs/${id}/file`, { responseType: 'blob' }).then((r) => triggerDownload(r.data, name)),
  /**
   * Récupère le fichier en blob via l'API authentifiée (cookies + CORS déjà
   * configurés). Affiché ensuite via une URL `blob:` (same-origin), ce qui
   * contourne X-Frame-Options / CSP frame-ancestors / CORP sur l'aperçu.
   */
  previewBlob: (id: string) =>
    api
      .get(`/docs/${id}/file`, { params: { inline: 1 }, responseType: 'blob' })
      .then((r) => r.data as Blob),

  listVersions: (id: string) =>
    api.get<DocVersion[]>(`/docs/${id}/versions`).then((r) => r.data),
  addVersion: (id: string, file: File, note?: string) => {
    const fd = new FormData();
    fd.append('file', file);
    if (note) fd.append('note', note);
    return api.post<DocItem>(`/docs/${id}/versions`, fd).then((r) => r.data);
  },
  restoreVersion: (docId: string, versionId: string) =>
    api.post<DocItem>(`/docs/${docId}/versions/${versionId}/restore`).then((r) => r.data),
  getAccess: (id: string) => api.get<string[]>(`/docs/${id}/access`).then((r) => r.data),
  setAccess: (id: string, userIds: string[]) =>
    api.put(`/docs/${id}/access`, { userIds }).then(() => undefined),
  setRestricted: (id: string, restricted: boolean) =>
    api.patch<DocItem>(`/docs/${id}/restricted`, { restricted }).then((r) => r.data),
  downloadVersion: (versionId: string, name: string) =>
    api
      .get(`/docs/versions/${versionId}/file`, { responseType: 'blob' })
      .then((r) => triggerDownload(r.data, name)),
};
