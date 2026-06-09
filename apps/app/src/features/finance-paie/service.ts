import { api } from '@/lib/api';
import { USE_MOCKS } from '@/lib/config';
import type { BulletinPaie, PeriodePaie } from './types';

/**
 * Finance : paie (cf. docs/contracts/finance-paie.md). VITE_MOCK_FINANCE=false → réel.
 *   /paie/periodes (GET/POST) · /:id/generer · /valider · /bulletins · /paie/bulletins/:id/payer
 * ⚠️ Taux/barèmes CNSS/ITS à valider expert-paie (paramétrés backend).
 */
const delay = <T>(value: T, ms = 150): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

// --- MOCK ---------------------------------------------------------------------
let periodes: PeriodePaie[] = [
  { id: 'pp1', annee: 2026, mois: 5, statut: 'VALIDEE', nbBulletins: 4, totalNet: 1_240_000 },
  { id: 'pp2', annee: 2026, mois: 6, statut: 'BROUILLON', nbBulletins: 0, totalNet: 0 },
];
const bulletinsByPeriode: Record<string, BulletinPaie[]> = {
  pp1: [
    { id: 'b1', periodeId: 'pp1', employeNom: 'Awa Koffi', salaireBrut: 420_000, totalRetenues: 78_000, netAPayer: 342_000, chargesPatronales: 67_000, statut: 'PAYE', paiementRef: 'MP-5521' },
    { id: 'b2', periodeId: 'pp1', employeNom: 'Jean Dupont', salaireBrut: 380_000, totalRetenues: 70_000, netAPayer: 310_000, chargesPatronales: 61_000, statut: 'VALIDE' },
  ],
};

const mockApi = {
  listPeriodes: () => delay([...periodes]),
  generer: (id: string) => {
    bulletinsByPeriode[id] = bulletinsByPeriode[id] ?? [
      { id: `b-${id}-1`, periodeId: id, employeNom: 'Awa Koffi', salaireBrut: 420_000, totalRetenues: 78_000, netAPayer: 342_000, chargesPatronales: 67_000, statut: 'BROUILLON' },
      { id: `b-${id}-2`, periodeId: id, employeNom: 'Jean Dupont', salaireBrut: 380_000, totalRetenues: 70_000, netAPayer: 310_000, chargesPatronales: 61_000, statut: 'BROUILLON' },
    ];
    const list = bulletinsByPeriode[id]!;
    periodes = periodes.map((p) => (p.id === id ? { ...p, nbBulletins: list.length, totalNet: list.reduce((s, b) => s + b.netAPayer, 0) } : p));
    return delay(periodes.find((p) => p.id === id)!);
  },
  valider: (id: string) => {
    periodes = periodes.map((p) => (p.id === id ? { ...p, statut: 'VALIDEE' as const } : p));
    (bulletinsByPeriode[id] ?? []).forEach((b) => (b.statut = 'VALIDE'));
    return delay(periodes.find((p) => p.id === id)!);
  },
  bulletins: (periodeId: string) => delay([...(bulletinsByPeriode[periodeId] ?? [])]),
  payer: (bulletinId: string, paiementRef: string) => {
    for (const list of Object.values(bulletinsByPeriode)) {
      const b = list.find((x) => x.id === bulletinId);
      if (b) { b.statut = 'PAYE'; b.paiementRef = paiementRef; return delay(b); }
    }
    return Promise.reject(new Error('Bulletin introuvable'));
  },
};

// --- HTTP ---------------------------------------------------------------------
const httpApi = {
  listPeriodes: () => api.get<PeriodePaie[]>('/paie/periodes').then((r) => r.data),
  generer: (id: string) => api.post<PeriodePaie>(`/paie/periodes/${id}/generer`).then((r) => r.data),
  valider: (id: string) => api.post<PeriodePaie>(`/paie/periodes/${id}/valider`).then((r) => r.data),
  bulletins: (periodeId: string) => api.get<BulletinPaie[]>(`/paie/periodes/${periodeId}/bulletins`).then((r) => r.data),
  payer: (bulletinId: string, paiementRef: string) =>
    api.post<BulletinPaie>(`/paie/bulletins/${bulletinId}/payer`, { paiementRef }).then((r) => r.data),
};

export const paieService = USE_MOCKS.finance ? mockApi : httpApi;
