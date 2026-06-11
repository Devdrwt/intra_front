import { api } from '@/lib/api';
import { USE_MOCKS } from '@/lib/config';
import type { Project, ProjectDocument, ProjectFilters, ProjectInput, ProjectPerson } from './types';

/**
 * Service Projets — endpoints /projects (intra_back module projects).
 *   GET/POST /projects · GET/PUT/DELETE /projects/:id
 *   POST /projects/:id/documents · GET .../download · DELETE .../:docId
 *   POST /projects/check-echeances
 */
function clean(f: ProjectFilters): Record<string, string> {
  const o: Record<string, string> = {};
  if (f.statut) o.statut = f.statut;
  if (f.q) o.q = f.q;
  return o;
}

const httpApi = {
  list: (f: ProjectFilters) => api.get<Project[]>('/projects', { params: clean(f) }).then((r) => r.data),
  assignables: () => api.get<ProjectPerson[]>('/projects/assignables').then((r) => r.data),
  get: (id: string) => api.get<Project>(`/projects/${id}`).then((r) => r.data),
  create: (input: ProjectInput) => api.post<Project>('/projects', input).then((r) => r.data),
  update: (id: string, input: ProjectInput) => api.put<Project>(`/projects/${id}`, input).then((r) => r.data),
  remove: (id: string) => api.delete(`/projects/${id}`).then(() => undefined),
  uploadDocument: (id: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post<ProjectDocument>(`/projects/${id}/documents`, fd).then((r) => r.data);
  },
  downloadDocument: (id: string, docId: string) =>
    api.get(`/projects/${id}/documents/${docId}/download`, { responseType: 'blob' }).then((r) => r.data as Blob),
  removeDocument: (id: string, docId: string) =>
    api.delete(`/projects/${id}/documents/${docId}`).then(() => undefined),
};

// --- MOCK (repli hors-ligne) --------------------------------------------------
const delay = <T>(value: T, ms = 200): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));
let store: Project[] = [];
let seq = 0;
const blank = (input: ProjectInput): Project => ({
  id: `p${++seq}`,
  nom: input.nom,
  description: input.description ?? null,
  statut: input.statut ?? 'EN_COURS',
  client: input.client ?? null,
  progression: input.progression ?? 0,
  dateDebut: input.dateDebut ?? null,
  dateFin: input.dateFin ?? null,
  livrableUrl: input.livrableUrl ?? null,
  responsable: null,
  membres: [],
  documents: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});
const mockApi = {
  list: (_f: ProjectFilters) => delay([...store]),
  assignables: () => delay([] as ProjectPerson[]),
  get: (id: string) => delay(store.find((p) => p.id === id)!),
  create: (input: ProjectInput) => {
    const p = blank(input);
    store = [p, ...store];
    return delay(p);
  },
  update: (id: string, input: ProjectInput) => {
    store = store.map((p) => (p.id === id ? { ...p, ...blank(input), id } : p));
    return delay(store.find((p) => p.id === id)!);
  },
  remove: (id: string) => {
    store = store.filter((p) => p.id !== id);
    return delay(undefined);
  },
  uploadDocument: (_id: string, file: File) =>
    delay({ id: `d${++seq}`, nom: file.name, size: file.size, type: file.type, createdAt: new Date().toISOString() }),
  downloadDocument: (_id: string, _docId: string) => delay(new Blob(['mock'])),
  removeDocument: (_id: string, _docId: string) => delay(undefined),
};

export const projectsService = USE_MOCKS.projects ? mockApi : httpApi;
