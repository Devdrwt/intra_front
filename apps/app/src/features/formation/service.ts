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
};

// --- HTTP ---------------------------------------------------------------------
const httpApi = {
  catalogue: () => api.get<Formation[]>('/formations').then((r) => r.data),
  demandes: () => api.get<DemandeFormation[]>('/demandes-formation', { params: { mine: true } }).then((r) => r.data),
  demander: (formationTitre: string, coutEstime?: number) =>
    api.post<DemandeFormation>('/demandes-formation', { formationLibre: formationTitre, coutEstime }).then((r) => r.data),
};

export const formationService = USE_MOCKS.formation ? mockApi : httpApi;
