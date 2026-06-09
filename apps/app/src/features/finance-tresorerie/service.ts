import { api } from '@/lib/api';
import { USE_MOCKS } from '@/lib/config';
import type { CompteTresorerie, MouvementInput, MouvementTresorerie } from './types';

/**
 * Finance : trésorerie (cf. docs/contracts/finance-tresorerie.md). VITE_MOCK_FINANCE=false → réel.
 *   /comptes-tresorerie · /mouvements-tresorerie (GET/POST) · /:id/rapprocher
 */
const delay = <T>(value: T, ms = 150): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));
const today = () => new Date().toISOString().slice(0, 10);

// --- MOCK ---------------------------------------------------------------------
const comptes: CompteTresorerie[] = [
  { id: 'tc1', type: 'CAISSE', nom: 'Caisse principale', compteCode: '571000', solde: 145_000 },
  { id: 'tc2', type: 'BANQUE', nom: 'Ecobank ...1234', compteCode: '521000', solde: 4_280_000 },
  { id: 'tc3', type: 'MOBILE_MONEY', nom: 'MoMo MTN Pro', compteCode: '551000', numero: '+22990000000', solde: 312_500 },
];
let mvtSeq = 2;
let mouvements: MouvementTresorerie[] = [
  { id: 'm1', compteId: 'tc3', date: today(), sens: 'SORTIE', montant: 18_000, libelle: 'Remboursement frais NF-0002', mode: 'MOBILE_MONEY', paiementRef: 'MP-88421', rapproche: false, sourceType: 'NOTE_FRAIS' },
  { id: 'm2', compteId: 'tc2', date: today(), sens: 'ENTREE', montant: 100_000, libelle: 'Encaissement FC-0002', mode: 'VIREMENT', rapproche: true, sourceType: 'FACTURE_CLIENT' },
];

function applySolde(m: MouvementTresorerie, delta: 1 | -1) {
  const c = comptes.find((x) => x.id === m.compteId);
  if (c) c.solde += delta * (m.sens === 'ENTREE' ? m.montant : -m.montant);
}

const mockApi = {
  listComptes: () => delay([...comptes]),
  listMouvements: (compteId?: string) =>
    delay(mouvements.filter((m) => !compteId || m.compteId === compteId)),
  createMouvement: (input: MouvementInput) => {
    mvtSeq += 1;
    const m: MouvementTresorerie = {
      id: `m${mvtSeq}`,
      compteId: input.compteId,
      date: today(),
      sens: input.sens,
      montant: input.montant,
      libelle: input.libelle,
      mode: input.mode,
      paiementRef: input.paiementRef,
      rapproche: false,
      sourceType: 'MANUEL',
    };
    mouvements = [m, ...mouvements];
    applySolde(m, 1);
    return delay(m);
  },
  rapprocher: (id: string) => {
    mouvements = mouvements.map((m) => (m.id === id ? { ...m, rapproche: true } : m));
    return delay(mouvements.find((m) => m.id === id)!);
  },
};

// --- HTTP ---------------------------------------------------------------------
const httpApi = {
  listComptes: () => api.get<CompteTresorerie[]>('/comptes-tresorerie').then((r) => r.data),
  listMouvements: (compteId?: string) =>
    api.get<MouvementTresorerie[]>('/mouvements-tresorerie', { params: compteId ? { compteId } : {} }).then((r) => r.data),
  createMouvement: (input: MouvementInput) =>
    api.post<MouvementTresorerie>('/mouvements-tresorerie', input).then((r) => r.data),
  rapprocher: (id: string) =>
    api.post<MouvementTresorerie>(`/mouvements-tresorerie/${id}/rapprocher`).then((r) => r.data),
};

export const tresorerieService = USE_MOCKS.finance ? mockApi : httpApi;
