import { api } from '@/lib/api';
import { USE_MOCKS } from '@/lib/config';
import type {
  FactureFournisseur,
  ModePaiement,
  NoteDeFrais,
  NoteDeFraisInput,
} from './types';

/**
 * Finance : dépenses (cf. docs/contracts/finance-depenses.md). VITE_MOCK_FINANCE=false → réel.
 *   /notes-frais (GET/POST) · /notes-frais/:id/soumettre · /rembourser
 *   /factures-fournisseur
 */
const delay = <T>(value: T, ms = 150): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));
const today = () => new Date().toISOString().slice(0, 10);

// --- MOCK ---------------------------------------------------------------------
let nf = 1;
let notes: NoteDeFrais[] = [
  { id: 'nf1', reference: 'NF-2026-0001', titre: 'Déplacement Cotonou', statut: 'SOUMISE', montantHt: 38_000, montantTva: 6_840, montantTtc: 44_840, createdAt: today() },
  { id: 'nf2', reference: 'NF-2026-0002', titre: 'Fournitures bureau', statut: 'REMBOURSEE', montantHt: 15_254, montantTva: 2_746, montantTtc: 18_000, modePaiement: 'MOBILE_MONEY', paiementRef: 'MP-88421', createdAt: today() },
];
const factures: FactureFournisseur[] = [
  { id: 'ff1', reference: 'FF-2026-0001', fournisseurNom: 'Bureautique Plus', numeroFournisseur: 'F-7781', dateFacture: today(), dateEcheance: '2026-07-15', montantTtc: 236_000, montantPaye: 0, statut: 'A_PAYER' },
  { id: 'ff2', reference: 'FF-2026-0002', fournisseurNom: 'CEET Énergie', dateFacture: today(), dateEcheance: '2026-06-30', montantTtc: 118_000, montantPaye: 50_000, statut: 'PARTIELLEMENT_PAYEE' },
];

const mockApi = {
  listNotes: () => delay([...notes]),
  createNote: (input: NoteDeFraisInput) => {
    nf += 1;
    const tva = input.montantTva ?? Math.round(input.montantHt * 0.18);
    const note: NoteDeFrais = {
      id: `nf${nf}`,
      reference: `NF-2026-${String(nf).padStart(4, '0')}`,
      titre: input.titre,
      statut: 'BROUILLON',
      montantHt: input.montantHt,
      montantTva: tva,
      montantTtc: input.montantHt + tva,
      createdAt: today(),
    };
    notes = [note, ...notes];
    return delay(note);
  },
  soumettre: (id: string) => {
    notes = notes.map((n) => (n.id === id ? { ...n, statut: 'SOUMISE' as const } : n));
    return delay(notes.find((n) => n.id === id)!);
  },
  rembourser: (id: string, modePaiement: ModePaiement, paiementRef: string) => {
    notes = notes.map((n) => (n.id === id ? { ...n, statut: 'REMBOURSEE' as const, modePaiement, paiementRef } : n));
    return delay(notes.find((n) => n.id === id)!);
  },
  listFactures: () => delay([...factures]),
};

// --- HTTP ---------------------------------------------------------------------
const httpApi = {
  listNotes: () => api.get<NoteDeFrais[]>('/notes-frais').then((r) => r.data),
  createNote: (input: NoteDeFraisInput) => api.post<NoteDeFrais>('/notes-frais', input).then((r) => r.data),
  soumettre: (id: string) => api.post<NoteDeFrais>(`/notes-frais/${id}/soumettre`).then((r) => r.data),
  rembourser: (id: string, modePaiement: ModePaiement, paiementRef: string) =>
    api.post<NoteDeFrais>(`/notes-frais/${id}/rembourser`, { modePaiement, paiementRef }).then((r) => r.data),
  listFactures: () => api.get<FactureFournisseur[]>('/factures-fournisseur').then((r) => r.data),
};

export const depensesService = USE_MOCKS.finance ? mockApi : httpApi;
