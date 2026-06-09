import { api } from '@/lib/api';
import { USE_MOCKS } from '@/lib/config';
import type { EncaissementInput, FactureClient, FactureClientInput } from './types';

/**
 * Finance : recettes (cf. docs/contracts/finance-recettes.md). VITE_MOCK_FINANCE=false → réel.
 *   /factures-client (GET/POST) · /:id/emettre · /:id/encaissements · /:id/relancer
 */
const delay = <T>(value: T, ms = 150): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));
const today = () => new Date().toISOString().slice(0, 10);

// --- MOCK ---------------------------------------------------------------------
let seq = 2;
let factures: FactureClient[] = [
  { id: 'fc1', reference: 'FC-2026-0001', clientNom: 'SOBEBRA SA', objet: 'Prestation conseil', statut: 'EMISE', dateFacture: today(), dateEcheance: '2026-07-01', montantHt: 500_000, montantTva: 90_000, montantTtc: 590_000, montantPaye: 0 },
  { id: 'fc2', reference: 'FC-2026-0002', clientNom: 'MTN Bénin', objet: 'Maintenance', statut: 'PARTIELLEMENT_PAYEE', dateFacture: today(), dateEcheance: '2026-06-10', montantHt: 200_000, montantTva: 36_000, montantTtc: 236_000, montantPaye: 100_000 },
];

const recompute = (f: FactureClient): FactureClient => {
  let statut = f.statut;
  if (f.statut !== 'BROUILLON' && f.statut !== 'ANNULEE') {
    if (f.montantPaye >= f.montantTtc) statut = 'PAYEE';
    else if (f.montantPaye > 0) statut = 'PARTIELLEMENT_PAYEE';
    else statut = 'EMISE';
  }
  return { ...f, statut };
};

const mockApi = {
  list: () => delay([...factures]),
  create: (input: FactureClientInput) => {
    seq += 1;
    const tva = Math.round(input.montantHt * 0.18);
    const f: FactureClient = {
      id: `fc${seq}`,
      reference: `FC-2026-${String(seq).padStart(4, '0')}`,
      clientNom: input.clientNom,
      objet: input.objet,
      statut: 'BROUILLON',
      dateFacture: today(),
      dateEcheance: input.dateEcheance,
      montantHt: input.montantHt,
      montantTva: tva,
      montantTtc: input.montantHt + tva,
      montantPaye: 0,
    };
    factures = [f, ...factures];
    return delay(f);
  },
  emettre: (id: string) => {
    factures = factures.map((f) => (f.id === id ? recompute({ ...f, statut: 'EMISE' }) : f));
    return delay(factures.find((f) => f.id === id)!);
  },
  encaisser: (id: string, input: EncaissementInput) => {
    factures = factures.map((f) =>
      f.id === id ? recompute({ ...f, montantPaye: f.montantPaye + input.montant }) : f,
    );
    return delay(factures.find((f) => f.id === id)!);
  },
};

// --- HTTP ---------------------------------------------------------------------
const httpApi = {
  list: () => api.get<FactureClient[]>('/factures-client').then((r) => r.data),
  create: (input: FactureClientInput) => api.post<FactureClient>('/factures-client', input).then((r) => r.data),
  emettre: (id: string) => api.post<FactureClient>(`/factures-client/${id}/emettre`).then((r) => r.data),
  encaisser: (id: string, input: EncaissementInput) =>
    api.post<FactureClient>(`/factures-client/${id}/encaissements`, input).then((r) => r.data),
};

export const recettesService = USE_MOCKS.finance ? mockApi : httpApi;
