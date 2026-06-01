import { api } from '@/lib/api';
import { USE_MOCKS } from '@/lib/config';
import type { Employe, EmployeInput, EmployeFilters } from './types';
import { MOCK_EMPLOYES } from './mock';

/**
 * Couche service du module RH.
 *
 * Par défaut on utilise le MOCK (front développable sans backend). Pour basculer
 * sur l'API NestJS réelle : définir `VITE_USE_MOCKS=false` dans apps/app/.env.
 * Les signatures sont identiques → le passage au réel ne change pas les hooks.
 */
const RESOURCE = '/employes';

// --- Implémentation MOCK (en mémoire) -----------------------------------------
let store: Employe[] = [...MOCK_EMPLOYES];
let seq = store.length;

const delay = <T>(value: T, ms = 250): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

function applyFilters(list: Employe[], f: EmployeFilters): Employe[] {
  return list.filter((e) => {
    if (f.statut && e.statut !== f.statut) return false;
    if (f.departement && e.departement !== f.departement) return false;
    if (f.search) {
      const q = f.search.toLowerCase();
      const hay = `${e.nom} ${e.prenom} ${e.matricule} ${e.poste} ${e.email}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

const mockApi = {
  list: (filters: EmployeFilters) => delay(applyFilters(store, filters)),
  get: (id: string) => delay(store.find((e) => e.id === id) ?? null),
  create: (input: EmployeInput) => {
    const created: Employe = { ...input, id: `e${++seq}` };
    store = [created, ...store];
    return delay(created);
  },
  update: (id: string, input: EmployeInput) => {
    const updated: Employe = { ...input, id };
    store = store.map((e) => (e.id === id ? updated : e));
    return delay(updated);
  },
  remove: (id: string) => {
    store = store.filter((e) => e.id !== id);
    return delay(undefined);
  },
};

// --- Implémentation API réelle (NestJS) ---------------------------------------
const httpApi = {
  list: (filters: EmployeFilters) => {
    // On n'envoie que les filtres renseignés : un `statut=''` casserait la
    // validation enum côté backend (class-validator @IsEnum).
    const params: Record<string, string> = {};
    if (filters.search) params.search = filters.search;
    if (filters.departement) params.departement = filters.departement;
    if (filters.statut) params.statut = filters.statut;
    return api.get<Employe[]>(RESOURCE, { params }).then((r) => r.data);
  },
  get: (id: string) => api.get<Employe>(`${RESOURCE}/${id}`).then((r) => r.data),
  create: (input: EmployeInput) => api.post<Employe>(RESOURCE, input).then((r) => r.data),
  update: (id: string, input: EmployeInput) =>
    api.put<Employe>(`${RESOURCE}/${id}`, input).then((r) => r.data),
  remove: (id: string) => api.delete(`${RESOURCE}/${id}`).then(() => undefined),
};

export const employesService = USE_MOCKS.rh ? mockApi : httpApi;
