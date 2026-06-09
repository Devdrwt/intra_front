import { api } from '@/lib/api';
import { USE_MOCKS } from '@/lib/config';
import type {
  CompteComptable,
  ExerciceComptable,
  JournalComptable,
  Taxe,
  Tiers,
  TiersInput,
  TiersType,
} from './types';

/**
 * Cœur financier (cf. docs/contracts/finance-core.md). VITE_MOCK_FINANCE=false → réel.
 *   /tiers · /comptes-comptables · /journaux-comptables · /taxes · /exercices · /finance/export
 */
const delay = <T>(value: T, ms = 150): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

// --- MOCK ---------------------------------------------------------------------
let seq = 2;
let tiers: Tiers[] = [
  { id: 'tr1', type: 'CLIENT', code: 'CL-0001', nom: 'SOBEBRA SA', ifu: '320...', compteCode: '411100', actif: true },
  { id: 'tr2', type: 'FOURNISSEUR', code: 'FO-0001', nom: 'Bureautique Plus', compteCode: '401100', actif: true },
];

const COMPTES: CompteComptable[] = [
  { id: 'c1', code: '401100', libelle: 'Fournisseurs', classe: '4', actif: true },
  { id: 'c2', code: '411100', libelle: 'Clients', classe: '4', actif: true },
  { id: 'c3', code: '445100', libelle: 'TVA déductible', classe: '4', actif: true },
  { id: 'c4', code: '443100', libelle: 'TVA collectée', classe: '4', actif: true },
  { id: 'c5', code: '521000', libelle: 'Banque', classe: '5', actif: true },
  { id: 'c6', code: '571000', libelle: 'Caisse', classe: '5', actif: true },
  { id: 'c7', code: '601000', libelle: 'Achats de marchandises', classe: '6', actif: true },
  { id: 'c8', code: '701000', libelle: 'Ventes de marchandises', classe: '7', actif: true },
];
const JOURNAUX: JournalComptable[] = [
  { id: 'j1', code: 'AC', libelle: 'Achats', type: 'ACHAT' },
  { id: 'j2', code: 'VE', libelle: 'Ventes', type: 'VENTE' },
  { id: 'j3', code: 'BQ', libelle: 'Banque', type: 'BANQUE' },
  { id: 'j4', code: 'CA', libelle: 'Caisse', type: 'CAISSE' },
  { id: 'j5', code: 'OD', libelle: 'Opérations diverses', type: 'OD' },
  { id: 'j6', code: 'PA', libelle: 'Paie', type: 'PAIE' },
];
const TAXES: Taxe[] = [
  { id: 'x1', code: 'TVA18', libelle: 'TVA 18 %', taux: 18, compteCode: '445100', actif: true },
  { id: 'x2', code: 'EXO', libelle: 'Exonéré', taux: 0, actif: true },
  { id: 'x3', code: 'AIB', libelle: 'Retenue AIB', taux: 1, actif: true },
];
const EXERCICES: ExerciceComptable[] = [
  { id: 'ex1', annee: 2026, debut: '2026-01-01', fin: '2026-12-31', cloture: false },
];

const mockApi = {
  listTiers: (type?: TiersType) =>
    delay(tiers.filter((t) => !type || t.type === type || t.type === 'LES_DEUX')),
  createTiers: (input: TiersInput) => {
    seq += 1;
    const prefix = input.type === 'CLIENT' ? 'CL' : input.type === 'FOURNISSEUR' ? 'FO' : 'TX';
    const t: Tiers = { ...input, id: `tr${seq}`, code: `${prefix}-${String(seq).padStart(4, '0')}`, actif: input.actif ?? true };
    tiers = [t, ...tiers];
    return delay(t);
  },
  deleteTiers: (id: string) => {
    tiers = tiers.filter((t) => t.id !== id);
    return delay(undefined);
  },
  comptes: () => delay(COMPTES),
  journaux: () => delay(JOURNAUX),
  taxes: () => delay(TAXES),
  exercices: () => delay(EXERCICES),
};

// --- HTTP ---------------------------------------------------------------------
const httpApi = {
  listTiers: (type?: TiersType) =>
    api.get<Tiers[]>('/tiers', { params: type ? { type } : {} }).then((r) => r.data),
  createTiers: (input: TiersInput) => api.post<Tiers>('/tiers', input).then((r) => r.data),
  deleteTiers: (id: string) => api.delete(`/tiers/${id}`).then(() => undefined),
  comptes: () => api.get<CompteComptable[]>('/comptes-comptables').then((r) => r.data),
  journaux: () => api.get<JournalComptable[]>('/journaux-comptables').then((r) => r.data),
  taxes: () => api.get<Taxe[]>('/taxes').then((r) => r.data),
  exercices: () => api.get<ExerciceComptable[]>('/exercices').then((r) => r.data),
};

export const financeCoreService = USE_MOCKS.finance ? mockApi : httpApi;

/** URL de l'export comptable (téléchargement direct, passe par le proxy + cookies). */
export function exportUrl(from: string, to: string, format: string): string {
  const base = import.meta.env.VITE_API_URL || '/api/v1';
  const params = new URLSearchParams({ from, to, format });
  return `${base}/finance/export?${params.toString()}`;
}
