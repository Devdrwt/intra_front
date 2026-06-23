import { api } from '@/lib/api';
import { USE_MOCKS } from '@/lib/config';
import type { Employe } from '@/features/rh/types';
import type {
  CategorieDemande,
  DemandeConge,
  JourSemaine,
  Pointage,
  PointageSens,
  TypeConge,
} from '@/features/presences/types';
import type { AttachmentRef, Rapport, StatutRapport } from '@/features/rapports/types';
import type { Document } from '@/features/documents/types';
import type { Project } from '@/features/projects/types';

/**
 * Espace collaborateur — endpoints « self » du backend (auto-scopés sur le token).
 * Voir docs/contracts/espace-collaborateur.md et intra_back/src/modules/me/.
 *   GET  /me/employe
 *   GET  /me/pointages            POST /me/pointages/pointer  { sens }
 *   GET  /me/conges               POST /me/conges             (MeCongeInput)
 *   GET  /me/rapports             PUT  /me/rapports           (MeRapportInput)
 *   GET  /me/documents
 */

/** Demande d'absence pour SOI (pas d'employeId : déduit du token). */
export interface MeCongeInput {
  categorie: CategorieDemande;
  type?: TypeConge;
  /** Vides pour un REPOS hebdomadaire (on envoie joursRepos à la place). */
  dateDebut: string;
  dateFin: string;
  /** Permission intra-journée (optionnel). */
  heureDebut?: string;
  heureFin?: string;
  /** Repos hebdomadaire : jour(s) de la semaine. */
  joursRepos?: JourSemaine[];
  /** Repos : cadence en semaines (1 = chaque semaine). */
  reposIntervalleSemaines?: number;
  motif?: string;
}

/** Mon profil. */
export interface MyProfile {
  firstName: string | null;
  lastName: string | null;
  email: string;
  telephone: string | null;
  poste: string | null;
  departement: string | null;
  hasAvatar: boolean;
}
export interface ProfileUpdate {
  firstName?: string;
  lastName?: string;
  telephone?: string;
}
export interface PasswordChange {
  currentPassword: string;
  newPassword: string;
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
  pointer: (sens: PointageSens, _coords?: { lat: number; lng: number }) => {
    let p = mPointages.find((x) => x.date === today());
    if (!p) {
      p = { id: `mp${++seq}`, employeId: MOCK_ID, date: today() };
      mPointages = [p, ...mPointages];
    }
    if (sens === 'ENTREE') p.heureEntree = nowHM();
    else if (sens === 'PAUSE') p.heurePauseDebut = nowHM();
    else if (sens === 'REPRISE') p.heurePauseFin = nowHM();
    else p.heureSortie = nowHM();
    return delay({ ...p });
  },
  myConges: () => delay([...mConges]),
  createConge: (input: MeCongeInput) => {
    const created: DemandeConge = {
      ...input,
      type: input.type ?? 'EXCEPTIONNEL',
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
  cancelConge: (id: string) => {
    mConges = mConges.filter((c) => c.id !== id);
    return delay(undefined);
  },
  deleteRapport: (id: string) => {
    mRapports = mRapports.filter((r) => r.id !== id);
    return delay(undefined);
  },
  getProfile: () =>
    delay<MyProfile>({ firstName: 'Démo', lastName: 'Collaborateur', email: 'demo@drwintech.com', telephone: null, poste: 'Collaborateur', departement: 'Général', hasAvatar: false }),
  updateProfile: (input: ProfileUpdate) =>
    delay<MyProfile>({ firstName: input.firstName ?? null, lastName: input.lastName ?? null, email: 'demo@drwintech.com', telephone: input.telephone ?? null, poste: null, departement: null, hasAvatar: false }),
  changePassword: (_input: PasswordChange) => delay(undefined),
  uploadAvatar: (_file: File) => delay(undefined),
  removeAvatar: () => delay(undefined),
  myProjects: () => delay([] as Project[]),
  downloadProjectDoc: (_projectId: string, _docId: string) => delay(new Blob(['mock'])),
};

// --- HTTP (NestJS) ------------------------------------------------------------
const httpApi = {
  myEmploye: () => api.get<Employe>('/me/employe').then((r) => r.data),
  myPointages: () => api.get<Pointage[]>('/me/pointages').then((r) => r.data),
  pointer: (sens: PointageSens, coords?: { lat: number; lng: number }) =>
    api
      .post<Pointage>('/me/pointages/pointer', { sens, lat: coords?.lat, lng: coords?.lng })
      .then((r) => r.data),
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
  cancelConge: (id: string) => api.delete(`/me/conges/${id}`).then(() => undefined),
  deleteRapport: (id: string) => api.delete(`/me/rapports/${id}`).then(() => undefined),
  getProfile: () => api.get<MyProfile>('/me/profile').then((r) => r.data),
  updateProfile: (input: ProfileUpdate) => api.put<MyProfile>('/me/profile', input).then((r) => r.data),
  changePassword: (input: PasswordChange) =>
    api.post('/me/password', input).then(() => undefined),
  uploadAvatar: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/me/avatar', fd).then(() => undefined);
  },
  removeAvatar: () => api.delete('/me/avatar').then(() => undefined),
  myProjects: () => api.get<Project[]>('/me/projects').then((r) => r.data),
  downloadProjectDoc: (projectId: string, docId: string) =>
    api
      .get(`/me/projects/${projectId}/documents/${docId}/download`, { responseType: 'blob' })
      .then((r) => r.data as Blob),
};

export const meService = USE_MOCKS.me ? mockApi : httpApi;
