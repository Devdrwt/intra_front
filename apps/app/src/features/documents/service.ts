import { api } from '@/lib/api';
import { USE_MOCKS } from '@/lib/config';
import type { Document, DocumentInput } from './types';

/**
 * Service GED — documents rattachés à un collaborateur.
 * MOCK par défaut ; API NestJS réelle avec `VITE_USE_MOCKS=false`.
 *  - list   → GET    /employes/:employeId/documents
 *  - create → POST   /employes/:employeId/documents (métadonnées ; upload S3 géré à part)
 *  - remove → DELETE /documents/:id
 */
let store: Document[] = [
  {
    id: 'd1',
    employeId: 'e1',
    nom: 'Contrat CDI - Aïcha Kossou.pdf',
    type: 'CONTRAT',
    dateAjout: '2023-02-01',
    tailleKo: 320,
  },
  {
    id: 'd2',
    employeId: 'e3',
    nom: 'Contrat CDD - Sarah Houngbedji.pdf',
    type: 'CONTRAT',
    dateAjout: '2025-01-06',
    tailleKo: 298,
  },
  {
    id: 'd3',
    employeId: 'e4',
    nom: 'NDA - Marc Tossou.pdf',
    type: 'NDA',
    dateAjout: '2025-03-01',
    tailleKo: 140,
  },
];
let seq = store.length;

const delay = <T>(value: T, ms = 200): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

const mockApi = {
  listByEmploye: (employeId: string) =>
    delay(store.filter((d) => d.employeId === employeId)),
  create: (employeId: string, input: DocumentInput) => {
    const created: Document = {
      ...input,
      employeId,
      id: `d${++seq}`,
      dateAjout: new Date().toISOString().slice(0, 10),
    };
    store = [created, ...store];
    return delay(created);
  },
  remove: (id: string) => {
    store = store.filter((d) => d.id !== id);
    return delay(undefined);
  },
};

const httpApi = {
  listByEmploye: (employeId: string) =>
    api.get<Document[]>(`/employes/${employeId}/documents`).then((r) => r.data),
  create: (employeId: string, input: DocumentInput) => {
    // employeId est dans l'URL : on n'envoie que les métadonnées dans le body.
    const { nom, type, tailleKo } = input;
    return api
      .post<Document>(`/employes/${employeId}/documents`, { nom, type, tailleKo })
      .then((r) => r.data);
  },
  remove: (id: string) => api.delete(`/documents/${id}`).then(() => undefined),
};

export const documentsService = USE_MOCKS.documents ? mockApi : httpApi;
