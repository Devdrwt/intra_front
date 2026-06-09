import { api } from '@/lib/api';
import { USE_MOCKS } from '@/lib/config';

/**
 * Performance & recommandation (cf. docs/contracts/rh-evaluation.md, Partie C).
 * Agrège activités / rapports / missions / OKR par employé → score + recommandation.
 * VITE_MOCK_EVAL=false → réel.
 */
export type TypeRecommandation = 'RECONDUCTION' | 'PROMOTION' | 'FORMATION' | 'AVERTISSEMENT' | 'AUTRE';

export interface PerfEmploye {
  employeId: string;
  employeNom: string;
  poste?: string;
  tauxRapports: number; // %
  tachesTerminees: number;
  tachesTotal: number;
  tauxPresence: number; // %
  tauxOkr: number; // %
  scoreGlobal: number; // 0..100
  recommandation?: string;
  typeRecommandation?: TypeRecommandation;
}

const delay = <T>(value: T, ms = 160): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

// --- MOCK ---------------------------------------------------------------------
let perf: PerfEmploye[] = [
  { employeId: 'e1', employeNom: 'Awa Koffi', poste: 'Développeuse', tauxRapports: 92, tachesTerminees: 18, tachesTotal: 20, tauxPresence: 96, tauxOkr: 78, scoreGlobal: 88 },
  { employeId: 'e2', employeNom: 'Jean Dupont', poste: 'Comptable', tauxRapports: 70, tachesTerminees: 9, tachesTotal: 16, tauxPresence: 88, tauxOkr: 55, scoreGlobal: 68 },
  { employeId: 'e3', employeNom: 'Paul Mensah', poste: 'Chargé d’affaires', tauxRapports: 100, tachesTerminees: 14, tachesTotal: 15, tauxPresence: 99, tauxOkr: 90, scoreGlobal: 95 },
];

function draftReco(p: PerfEmploye): string {
  const forces: string[] = [];
  const axes: string[] = [];
  (p.tauxRapports >= 85 ? forces : axes).push(`rapports (${p.tauxRapports}%)`);
  (p.tauxPresence >= 90 ? forces : axes).push(`assiduité (${p.tauxPresence}%)`);
  ((p.tachesTotal ? p.tachesTerminees / p.tachesTotal : 0) >= 0.8 ? forces : axes).push(
    `missions (${p.tachesTerminees}/${p.tachesTotal})`,
  );
  (p.tauxOkr >= 70 ? forces : axes).push(`objectifs (${p.tauxOkr}%)`);
  const verdict = p.scoreGlobal >= 85 ? 'Performance excellente — promotion / responsabilités accrues à envisager.'
    : p.scoreGlobal >= 70 ? 'Performance satisfaisante — reconduction recommandée.'
    : 'Performance en deçà des attentes — plan d’accompagnement / formation conseillé.';
  return (
    `Recommandation (brouillon — à vérifier) pour ${p.employeNom}\n\n` +
    `Score global : ${p.scoreGlobal}/100.\n` +
    `Points forts : ${forces.join(', ') || '—'}.\n` +
    `Axes de progrès : ${axes.join(', ') || '—'}.\n\n` +
    `${verdict}`
  );
}

const mockApi = {
  list: () => delay([...perf]),
  generer: (employeId: string): Promise<{ recommandation: string }> => {
    const p = perf.find((x) => x.employeId === employeId);
    return delay({ recommandation: p ? draftReco(p) : '' });
  },
  save: (employeId: string, recommandation: string, type: TypeRecommandation) => {
    perf = perf.map((p) => (p.employeId === employeId ? { ...p, recommandation, typeRecommandation: type } : p));
    return delay(perf.find((p) => p.employeId === employeId)!);
  },
};

// --- HTTP ---------------------------------------------------------------------
const httpApi = {
  list: () => api.get<PerfEmploye[]>('/performance').then((r) => r.data),
  generer: (employeId: string) =>
    api.post<{ recommandation: string }>(`/performance/${employeId}/recommandation/generer`).then((r) => r.data),
  save: (employeId: string, recommandation: string, type: TypeRecommandation) =>
    api.put<PerfEmploye>(`/performance/${employeId}/recommandation`, { recommandation, typeRecommandation: type }).then((r) => r.data),
};

export const performanceService = USE_MOCKS.eval ? mockApi : httpApi;
