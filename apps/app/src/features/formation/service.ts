import { api } from '@/lib/api';
import { USE_MOCKS } from '@/lib/config';

/**
 * SIRH : Formation (cf. docs/contracts/rh-formation.md).
 * VITE_MOCK_FORMATION=false → réel. /formations · /demandes-formation
 */
export interface Formation {
  id: string;
  titre: string;
  type: 'INTERNE' | 'EXTERNE' | 'EN_LIGNE';
  organisme?: string;
  competencesVisees: string[];
  coutEstime?: number;
  dureeHeures?: number;
}
export interface DemandeFormation {
  id: string;
  reference: string;
  formationTitre: string;
  statut: 'BROUILLON' | 'SOUMISE' | 'APPROUVEE' | 'REJETEE' | 'INSCRITE';
  coutEstime?: number;
}
export type StatutSession = 'PLANIFIEE' | 'OUVERTE' | 'COMPLETE' | 'TERMINEE' | 'ANNULEE';
export interface Session {
  id: string;
  formationId?: string;
  formationTitre: string;
  dateDebut: string;
  dateFin: string;
  lieu?: string;
  formateur?: string;
  capacite?: number;
  statut: StatutSession;
  nbInscrits: number;
}
export interface SessionInput {
  formationId: string;
  dateDebut: string;
  dateFin: string;
  lieu?: string;
  formateur?: string;
  capacite?: number;
}

const delay = <T>(value: T, ms = 150): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

// --- MOCK ---------------------------------------------------------------------
const catalogue: Formation[] = [
  { id: 'f1', titre: 'Comptabilité OHADA avancée', type: 'EXTERNE', organisme: 'Cabinet KPMG', competencesVisees: ['COMPTA_OHADA'], coutEstime: 250_000, dureeHeures: 21 },
  { id: 'f2', titre: 'Excel avancé', type: 'EN_LIGNE', competencesVisees: ['EXCEL_AV'], coutEstime: 45_000, dureeHeures: 12 },
  { id: 'f3', titre: 'Management d’équipe', type: 'INTERNE', competencesVisees: ['MANAGEMENT'], dureeHeures: 8 },
];
let demandes: DemandeFormation[] = [
  { id: 'df1', reference: 'DF-2026-0001', formationTitre: 'Excel avancé', statut: 'APPROUVEE', coutEstime: 45_000 },
];

const mockApi = {
  catalogue: () => delay([...catalogue]),
  demandes: () => delay([...demandes]),
  demander: (formationTitre: string, coutEstime?: number) => {
    const ref = `DF-2026-${String(demandes.length + 1).padStart(4, '0')}`;
    const d: DemandeFormation = { id: `df${Date.now()}`, reference: ref, formationTitre, statut: 'SOUMISE', coutEstime };
    demandes = [d, ...demandes];
    return delay(d);
  },
  sessions: () => delay([] as Session[]),
  createSession: (input: SessionInput) => delay({ id: `s${Date.now()}`, ...input, formationTitre: '', statut: 'PLANIFIEE', nbInscrits: 0 } as Session),
  inscrire: (_sessionId: string, _employeId: string) => delay(undefined),
};

// --- HTTP ---------------------------------------------------------------------
const httpApi = {
  catalogue: () => api.get<Formation[]>('/formations').then((r) => r.data),
  demandes: () => api.get<DemandeFormation[]>('/demandes-formation', { params: { mine: true } }).then((r) => r.data),
  demander: (formationTitre: string, coutEstime?: number) =>
    api.post<DemandeFormation>('/demandes-formation', { formationLibre: formationTitre, coutEstime }).then((r) => r.data),
  sessions: () => api.get<Session[]>('/sessions-formation').then((r) => r.data),
  createSession: (input: SessionInput) => api.post<Session>('/sessions-formation', input).then((r) => r.data),
  inscrire: (sessionId: string, employeId: string) =>
    api.post(`/sessions-formation/${sessionId}/inscriptions`, { employeId }).then(() => undefined),
};

export const formationService = USE_MOCKS.formation ? mockApi : httpApi;
