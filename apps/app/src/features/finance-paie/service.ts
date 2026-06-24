import { api } from '@/lib/api';
import { USE_MOCKS } from '@/lib/config';
import { triggerDownload } from '@/lib/download';
import type { BulletinPaie, PeriodePaie } from './types';

export interface DeclarationCnss {
  lignes: {
    employeId: string;
    employeNom: string;
    numeroCnss: string | null;
    assietteCotisable: number;
    cnssSalariale: number;
    cnssPatronale: number;
  }[];
  totaux: { assietteCotisable: number; cnssSalariale: number; cnssPatronale: number };
}
export interface DeclarationIts {
  lignes: { employeId: string; employeNom: string; assietteImposable: number; itsRetenu: number }[];
  total: { itsRetenu: number };
}

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
  declarationCnss: (id: string) =>
    api.get<DeclarationCnss>(`/paie/periodes/${id}/declaration-cnss`).then((r) => r.data),
  declarationIts: (id: string) =>
    api.get<DeclarationIts>(`/paie/periodes/${id}/declaration-its`).then((r) => r.data),
  exportCsv: (id: string, filename: string) =>
    api.get(`/paie/periodes/${id}/export`, { responseType: 'blob' }).then((r) => triggerDownload(r.data as Blob, filename)),
  bulletinPdf: (id: string, filename: string) =>
    api.get(`/paie/bulletins/${id}/pdf`, { responseType: 'blob' }).then((r) => triggerDownload(r.data as Blob, filename)),
};

const emptyCnss: DeclarationCnss = { lignes: [], totaux: { assietteCotisable: 0, cnssSalariale: 0, cnssPatronale: 0 } };
const emptyIts: DeclarationIts = { lignes: [], total: { itsRetenu: 0 } };

export const paieService = USE_MOCKS.finance
  ? {
      ...mockApi,
      declarationCnss: (_id: string) => delay(emptyCnss),
      declarationIts: (_id: string) => delay(emptyIts),
      exportCsv: (_id: string, _filename: string) => delay(undefined),
      bulletinPdf: (_id: string, _filename: string) => delay(undefined),
    }
  : httpApi;
