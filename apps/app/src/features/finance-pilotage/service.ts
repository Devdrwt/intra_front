import { api } from '@/lib/api';
import { USE_MOCKS } from '@/lib/config';

/**
 * Finance : pilotage (cf. docs/contracts/finance-pilotage.md). VITE_MOCK_FINANCE=false → réel.
 *   /finance/dashboard/* · /budgets · /budgets/:id/suivi
 */
export interface FinanceDashboard {
  tresorerie: number;
  creancesDues: number;
  creancesEnRetard: number;
  dettes: number;
  produits: number;
  charges: number;
  resultat: number;
  masseSalariale: number;
}
export interface LigneBudgetSuivi {
  cibleLabel: string;
  prevu: number;
  realise: number;
  consommation: number; // 0..1+
  depasse: boolean;
}

const delay = <T>(value: T, ms = 150): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

// --- MOCK ---------------------------------------------------------------------
const DASH: FinanceDashboard = {
  tresorerie: 4_737_500,
  creancesDues: 826_000,
  creancesEnRetard: 236_000,
  dettes: 304_000,
  produits: 2_100_000,
  charges: 1_180_000,
  resultat: 920_000,
  masseSalariale: 1_240_000,
};
const BUDGETS: LigneBudgetSuivi[] = [
  { cibleLabel: 'Marketing', prevu: 1_000_000, realise: 880_000, consommation: 0.88, depasse: false },
  { cibleLabel: 'IT', prevu: 2_000_000, realise: 900_000, consommation: 0.45, depasse: false },
  { cibleLabel: 'Formation', prevu: 500_000, realise: 620_000, consommation: 1.24, depasse: true },
];

const mockApi = {
  dashboard: () => delay(DASH),
  budgets: () => delay(BUDGETS),
};

// --- HTTP ---------------------------------------------------------------------
const httpApi = {
  dashboard: async (): Promise<FinanceDashboard> => {
    const [tres, cre, det, res, ms] = await Promise.all([
      api.get('/finance/dashboard/tresorerie').then((r) => r.data),
      api.get('/finance/dashboard/creances').then((r) => r.data),
      api.get('/finance/dashboard/dettes').then((r) => r.data),
      api.get('/finance/dashboard/resultat').then((r) => r.data),
      api.get('/finance/dashboard/masse-salariale').then((r) => r.data),
    ]);
    return {
      tresorerie: tres.totalDisponible ?? 0,
      creancesDues: cre.totalDu ?? 0,
      creancesEnRetard: cre.enRetard ?? 0,
      dettes: det.totalAPayer ?? 0,
      produits: res.produits ?? 0,
      charges: res.charges ?? 0,
      resultat: res.resultat ?? 0,
      masseSalariale: ms.total ?? 0,
    };
  },
  budgets: () => api.get<LigneBudgetSuivi[]>('/finance/dashboard/budgets').then((r) => r.data),
};

export const pilotageService = USE_MOCKS.finance ? mockApi : httpApi;
