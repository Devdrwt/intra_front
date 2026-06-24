import { api } from '@/lib/api';
import type { Objectif } from '@/features/evaluation/service';

/** Portail RH du collaborateur — agrège les endpoints /me/* (objectifs, évals, perf, formations). */
export interface MyPerformance {
  periode: string;
  tauxRapports: number;
  tachesTerminees: number;
  tachesTotal: number;
  tauxPresence: number;
  tauxOkr: number;
  scoreGlobal: number;
  recommandation?: string;
  typeRecommandation?: string;
}
export interface MyEvaluation {
  id: string;
  campagneId: string;
  statut: string;
  noteGlobale: number | null;
  updatedAt: string;
}
export interface MyInscription {
  sessionId: string;
  formationTitre: string;
  dateDebut: string;
  dateFin: string;
  statut: string;
  satisfaction?: number;
  competencesValidees: string[];
}
export interface MyFormations {
  demandes: { id: string; statut: string }[];
  inscriptions: MyInscription[];
}

export const monrhService = {
  objectifs: () => api.get<Objectif[]>('/me/objectifs').then((r) => r.data),
  evaluations: () => api.get<MyEvaluation[]>('/me/evaluations').then((r) => r.data),
  performance: () => api.get<MyPerformance>('/me/performance').then((r) => r.data),
  formations: () => api.get<MyFormations>('/me/formations').then((r) => r.data),
};
