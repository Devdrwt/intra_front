import { api } from '@/lib/api';
import { USE_MOCKS } from '@/lib/config';
import type { Employe } from '@/features/rh/types';
import type { DemandeConge, Pointage, TypeConge } from '@/features/presences/types';
import type { AttachmentRef, Rapport, StatutRapport } from '@/features/rapports/types';
import type { Document } from '@/features/documents/types';

/**
 * Espace collaborateur — endpoints « self » du backend (auto-scopés sur le token).
 * Voir docs/contracts/espace-collaborateur.md et intra_back/src/modules/me/.
 *   GET  /me/employe
 *   GET  /me/pointages            POST /me/pointages/pointer  { sens }
 *   GET  /me/conges               POST /me/conges             (MeCongeInput)
 *   GET  /me/rapports             PUT  /me/rapports           (MeRapportInput)
 *   GET  /me/documents
 */

/** Demande de congé pour SOI (pas d'employeId : déduit du token). */
export interface MeCongeInput {
  type: TypeConge;
  dateDebut: string;
  dateFin: string;
  motif?: string;
}

/** Rapport journalier pour SOI (upsert). */
export interface MeRapportInput {
  date?: string;
  contenu: string;
  statut?: StatutRapport;
  attachmentKey?: string;
  attachmentName?: string;
  attachmentSize?: number;
  attachmentType?: string;
}

// --- MOCK (repli hors-ligne) --------------------------------------------------
const today = () => new Date().toISOString().slice(0, 10);
const nowHM = () => new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
const delay = <T>(value: T, ms = 180): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

const MOCK_ID = 'me-emp';
const mockEmploye: Employe = {
  id: MOCK_ID,
  matricule: 'EMP-0001',
  prenom: 'Démo',
  nom: 'Collaborateur',
  email: 'demo@drwintech.com',
  poste: 'Collaborateur',
  departement: 'Général',
  typeContrat: 'CDI',
  statut: 'ACTIF',
  dateEmbauche: '2025-01-06',
};
let mPointages: Pointage[] = [{ id: 'mp1', employeId: MOCK_ID, date: today(), heureEntree: '08:10' }];
let mConges: DemandeConge[] = [];
let mRapports: Rapport[] = [];
let seq = 1;

const mockApi = {
  myEmploye: () => delay({ ...mockEmploye }),
  myPointages: () => delay([...mPointages]),
  pointer: (sens: 'ENTREE' | 'SORTIE') => {
    let p = mPointages.find((x) => x.date === today());
    if (!p) {
      p = { id: `mp${++seq}`, employeId: MOCK_ID, date: today() };
      mPointages = [p, ...mPointages];
    }
    if (sens === 'ENTREE') p.heureEntree = nowHM();
    else p.heureSortie = nowHM();
    return delay({ ...p });
  },
  myConges: () => delay([...mConges]),
  createConge: (input: MeCongeInput) => {
    const created: DemandeConge = {
      ...input,
      id: `mc${++seq}`,
      employeId: MOCK_ID,
      statut: 'EN_ATTENTE',
      demandeLe: today(),
    };
    mConges = [created, ...mConges];
    return delay(created);
  },
  myRapports: () => delay([...mRapports]),
  upsertRapport: (input: MeRapportInput) => {
    const date = input.date || today();
    const existing = mRapports.find((r) => r.date === date);
    const saved: Rapport = {
      id: existing?.id ?? `mr${++seq}`,
      employeId: MOCK_ID,
      date,
      contenu: input.contenu,
      statut: input.statut ?? 'BROUILLON',
      submittedAt: input.statut === 'SOUMIS' ? new Date().toISOString() : existing?.submittedAt,
    };
    mRapports = [saved, ...mRapports.filter((r) => r.id !== saved.id)];
    return delay(saved);
  },
  myDocuments: () => delay([] as Document[]),
  uploadAttachment: (file: File) =>
    delay({ key: `rapports/mock-${++seq}`, name: file.name, size: file.size, type: file.type }),
  downloadRapportAttachment: (_id: string) => delay(new Blob(['mock'])),
};

// --- HTTP (NestJS) ------------------------------------------------------------
const httpApi = {
  myEmploye: () => api.get<Employe>('/me/employe').then((r) => r.data),
  myPointages: () => api.get<Pointage[]>('/me/pointages').then((r) => r.data),
  pointer: (sens: 'ENTREE' | 'SORTIE') =>
    api.post<Pointage>('/me/pointages/pointer', { sens }).then((r) => r.data),
  myConges: () => api.get<DemandeConge[]>('/me/conges').then((r) => r.data),
  createConge: (input: MeCongeInput) =>
    api.post<DemandeConge>('/me/conges', input).then((r) => r.data),
  myRapports: () => api.get<Rapport[]>('/me/rapports').then((r) => r.data),
  upsertRapport: (input: MeRapportInput) =>
    api.put<Rapport>('/me/rapports', input).then((r) => r.data),
  myDocuments: () => api.get<Document[]>('/me/documents').then((r) => r.data),
  uploadAttachment: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post<AttachmentRef>('/me/rapports/attachment', fd).then((r) => r.data);
  },
  downloadRapportAttachment: (id: string) =>
    api.get(`/me/rapports/${id}/attachment`, { responseType: 'blob' }).then((r) => r.data as Blob),
};

export const meService = USE_MOCKS.me ? mockApi : httpApi;
