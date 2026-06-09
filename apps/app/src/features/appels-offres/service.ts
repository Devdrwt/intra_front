import { api } from '@/lib/api';
import { USE_MOCKS } from '@/lib/config';

/**
 * Appels d'offres (cf. docs/contracts/appels-offres.md). VITE_MOCK_COMMERCIAL=false → réel.
 *   /aao · /aao/:id/decision · /soumissions · /:id/soumettre · /:id/resultat · /convertir-projet
 */
export type StatutAao = 'REPERE' | 'A_SOUMETTRE' | 'ECARTE';
export type StatutSoumission = 'EN_PREPARATION' | 'DEPOSEE' | 'GAGNEE' | 'PERDUE' | 'INFRUCTUEUSE';

export interface Aao {
  id: string;
  reference: string;
  objet: string;
  bailleur?: string;
  dateLimite?: string;
  montantEstime?: number;
  statut: StatutAao;
}
export interface AaoInput {
  objet: string;
  bailleur?: string;
  dateLimite?: string;
  montantEstime?: number;
}
export interface Soumission {
  id: string;
  aaoObjet: string;
  statut: StatutSoumission;
  montantPropose?: number;
  dateDepot?: string;
}

const delay = <T>(value: T, ms = 150): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

// --- MOCK ---------------------------------------------------------------------
let seq = 2;
let aaos: Aao[] = [
  { id: 'a1', reference: 'AAO-2026-0001', objet: 'Refonte du SI de la mairie', bailleur: 'Mairie de Cotonou', dateLimite: '2026-07-20', montantEstime: 25_000_000, statut: 'A_SOUMETTRE' },
  { id: 'a2', reference: 'AAO-2026-0002', objet: 'Fourniture de licences', bailleur: 'PNUD', dateLimite: '2026-06-30', montantEstime: 8_000_000, statut: 'REPERE' },
];
let soumissions: Soumission[] = [
  { id: 's1', aaoObjet: 'Refonte du SI de la mairie', statut: 'EN_PREPARATION', montantPropose: 23_500_000 },
];

const mockApi = {
  listAao: () => delay([...aaos]),
  createAao: (input: AaoInput) => {
    seq += 1;
    const a: Aao = { id: `a${seq}`, reference: `AAO-2026-${String(seq).padStart(4, '0')}`, ...input, statut: 'REPERE' };
    aaos = [a, ...aaos];
    return delay(a);
  },
  decision: (id: string, statut: StatutAao) => {
    aaos = aaos.map((a) => (a.id === id ? { ...a, statut } : a));
    return delay(aaos.find((a) => a.id === id)!);
  },
  listSoumissions: () => delay([...soumissions]),
  resultat: (id: string, statut: StatutSoumission) => {
    soumissions = soumissions.map((s) => (s.id === id ? { ...s, statut } : s));
    return delay(soumissions.find((s) => s.id === id)!);
  },
};

// --- HTTP ---------------------------------------------------------------------
const httpApi = {
  listAao: () => api.get<Aao[]>('/aao').then((r) => r.data),
  createAao: (input: AaoInput) => api.post<Aao>('/aao', input).then((r) => r.data),
  decision: (id: string, statut: StatutAao) => api.patch<Aao>(`/aao/${id}/decision`, { statut }).then((r) => r.data),
  listSoumissions: () => api.get<Soumission[]>('/soumissions').then((r) => r.data),
  resultat: (id: string, statut: StatutSoumission) =>
    api.post<Soumission>(`/soumissions/${id}/resultat`, { statut }).then((r) => r.data),
};

export const commercialService = USE_MOCKS.commercial ? mockApi : httpApi;
