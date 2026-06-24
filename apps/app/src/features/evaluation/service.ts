import { api } from '@/lib/api';
import { USE_MOCKS } from '@/lib/config';

/**
 * SIRH : Évaluation & Objectifs/OKR (cf. docs/contracts/rh-evaluation.md).
 * VITE_MOCK_EVAL=false → réel. /objectifs · /me/objectifs · /campagnes-evaluation · /evaluations
 */
export type NiveauObjectif = 'INDIVIDUEL' | 'EQUIPE' | 'ENTREPRISE';
export interface ResultatCle {
  id: string;
  libelle: string;
  valeurCible: number;
  valeurActuelle: number;
  unite?: string;
}
export interface Objectif {
  id: string;
  niveau: NiveauObjectif;
  titre: string;
  periode: string;
  progression: number; // 0..100
  resultatsCles: ResultatCle[];
}
export interface Campagne {
  id: string;
  nom: string;
  periode: string;
  statut: 'PLANIFIEE' | 'EN_COURS' | 'CLOTUREE';
  nbEvaluations: number;
}
export interface ResultatCleInput {
  libelle: string;
  valeurCible: number;
  unite?: string;
}
export interface ObjectifInput {
  niveau: NiveauObjectif;
  titre: string;
  periode: string;
  employeId?: string;
  departement?: string;
  resultatsCles: ResultatCleInput[];
}

const delay = <T>(value: T, ms = 150): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

// --- MOCK ---------------------------------------------------------------------
const objectifs: Objectif[] = [
  {
    id: 'o1', niveau: 'INDIVIDUEL', titre: 'Satisfaction client', periode: '2026-T1', progression: 78,
    resultatsCles: [
      { id: 'r1', libelle: 'NPS', valeurCible: 60, valeurActuelle: 47, unite: 'pts' },
      { id: 'r2', libelle: 'Tickets résolus < 24h', valeurCible: 90, valeurActuelle: 82, unite: '%' },
    ],
  },
  {
    id: 'o2', niveau: 'EQUIPE', titre: 'Délai de livraison projets', periode: '2026-T1', progression: 60,
    resultatsCles: [{ id: 'r3', libelle: 'Projets livrés à temps', valeurCible: 95, valeurActuelle: 70, unite: '%' }],
  },
];
const campagnes: Campagne[] = [
  { id: 'c1', nom: 'Évaluation annuelle 2026', periode: '2026', statut: 'EN_COURS', nbEvaluations: 12 },
];

const mockApi = {
  objectifs: () => delay([...objectifs]),
  campagnes: () => delay([...campagnes]),
  createObjectif: (input: ObjectifInput) =>
    delay({ id: `o${objectifs.length + 1}`, niveau: input.niveau, titre: input.titre, periode: input.periode, progression: 0, resultatsCles: input.resultatsCles.map((r, i) => ({ id: `nr${i}`, libelle: r.libelle, valeurCible: r.valeurCible, valeurActuelle: 0, unite: r.unite })) } as Objectif),
  removeObjectif: (_id: string) => delay(undefined),
  updateResultatCle: (id: string, valeurActuelle: number) => delay({ id, libelle: '', valeurCible: 0, valeurActuelle } as ResultatCle),
};

// --- HTTP ---------------------------------------------------------------------
const httpApi = {
  objectifs: () => api.get<Objectif[]>('/objectifs').then((r) => r.data),
  campagnes: () => api.get<Campagne[]>('/campagnes-evaluation').then((r) => r.data),
  createObjectif: (input: ObjectifInput) => api.post<Objectif>('/objectifs', input).then((r) => r.data),
  removeObjectif: (id: string) => api.delete(`/objectifs/${id}`).then(() => undefined),
  updateResultatCle: (id: string, valeurActuelle: number) =>
    api.patch<ResultatCle>(`/resultats-cles/${id}`, { valeurActuelle }).then((r) => r.data),
};

export const evaluationService = USE_MOCKS.eval ? mockApi : httpApi;
