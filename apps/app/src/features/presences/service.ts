import { api } from '@/lib/api';
import { USE_MOCKS } from '@/lib/config';
import type {
  DemandeConge,
  DemandeCongeInput,
  Mission,
  MissionInput,
  Pointage,
  PointageSens,
  StatutConge,
  SuiviPointage,
} from './types';

/**
 * Service Présences & Congés. MOCK par défaut ; API NestJS avec `VITE_USE_MOCKS=false`.
 * Endpoints réels attendus :
 *   GET  /pointages?date=YYYY-MM-DD
 *   POST /pointages/pointer            { employeId, sens: 'ENTREE' | 'SORTIE' }
 *   GET  /conges
 *   POST /conges                       (DemandeCongeInput)
 *   PATCH /conges/:id/statut           { statut }
 */
const today = () => new Date().toISOString().slice(0, 10);
const nowHM = () =>
  new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
const delay = <T>(value: T, ms = 200): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

// --- MOCK ---------------------------------------------------------------------
let pointages: Pointage[] = [
  { id: 'p1', employeId: 'e1', date: today(), heureEntree: '08:12' },
  { id: 'p2', employeId: 'e2', date: today(), heureEntree: '08:45', heureSortie: '17:30' },
];
let conges: DemandeConge[] = [
  {
    id: 'c1',
    employeId: 'e3',
    categorie: 'CONGE',
    type: 'ANNUEL',
    dateDebut: today(),
    dateFin: today(),
    statut: 'EN_ATTENTE',
    demandeLe: today(),
    motif: 'Congé planifié',
  },
  {
    id: 'c2',
    employeId: 'e2',
    categorie: 'CONGE',
    type: 'MALADIE',
    dateDebut: '2026-05-20',
    dateFin: '2026-05-22',
    statut: 'APPROUVE',
    demandeLe: '2026-05-19',
  },
];
let missions: Mission[] = [];
let pSeq = pointages.length;
let cSeq = conges.length;

const mockApi = {
  pointagesDuJour: () => delay(pointages.filter((p) => p.date === today())),
  pointer: (employeId: string, sens: PointageSens) => {
    let p = pointages.find((x) => x.employeId === employeId && x.date === today());
    if (!p) {
      p = { id: `p${++pSeq}`, employeId, date: today() };
      pointages = [p, ...pointages];
    }
    if (sens === 'ENTREE') p.heureEntree = nowHM();
    else if (sens === 'PAUSE') p.heurePauseDebut = nowHM();
    else if (sens === 'REPRISE') p.heurePauseFin = nowHM();
    else p.heureSortie = nowHM();
    return delay({ ...p });
  },
  listConges: () => delay([...conges]),
  createConge: (input: DemandeCongeInput) => {
    const created: DemandeConge = {
      ...input,
      id: `c${++cSeq}`,
      statut: 'EN_ATTENTE',
      demandeLe: today(),
    };
    conges = [created, ...conges];
    return delay(created);
  },
  setStatutConge: (id: string, statut: StatutConge) => {
    conges = conges.map((c) => (c.id === id ? { ...c, statut } : c));
    return delay(conges.find((c) => c.id === id)!);
  },
  cancelConge: (id: string) => {
    conges = conges.filter((c) => c.id !== id);
    return delay(undefined);
  },
  suivi: (_from?: string, _to?: string) =>
    delay(pointages.map((p) => ({ ...p, employeNom: p.employeId })) as SuiviPointage[]),
  tendance: () => delay([] as { date: string; present: number; total: number }[]),
  listMissions: () => delay([...missions]),
  createMission: (input: MissionInput) => {
    const m: Mission = { id: `mi${++pSeq}`, ...input, lieu: input.lieu ?? null, createdAt: today() };
    missions = [m, ...missions];
    return delay(m);
  },
  removeMission: (id: string) => {
    missions = missions.filter((m) => m.id !== id);
    return delay(undefined);
  },
};

// --- HTTP (NestJS) ------------------------------------------------------------
const httpApi = {
  pointagesDuJour: () =>
    api.get<Pointage[]>('/pointages', { params: { date: today() } }).then((r) => r.data),
  pointer: (employeId: string, sens: PointageSens) =>
    api.post<Pointage>('/pointages/pointer', { employeId, sens }).then((r) => r.data),
  listConges: () => api.get<DemandeConge[]>('/conges').then((r) => r.data),
  createConge: (input: DemandeCongeInput) =>
    api.post<DemandeConge>('/conges', input).then((r) => r.data),
  setStatutConge: (id: string, statut: StatutConge) =>
    api.patch<DemandeConge>(`/conges/${id}/statut`, { statut }).then((r) => r.data),
  cancelConge: (id: string) => api.delete(`/conges/${id}`).then(() => undefined),
  suivi: (from?: string, to?: string) =>
    api.get<SuiviPointage[]>('/pointages/suivi', { params: { from, to } }).then((r) => r.data),
  tendance: () =>
    api
      .get<{ date: string; present: number; total: number }[]>('/pointages/tendance')
      .then((r) => r.data),
  listMissions: () => api.get<Mission[]>('/missions').then((r) => r.data),
  createMission: (input: MissionInput) => api.post<Mission>('/missions', input).then((r) => r.data),
  removeMission: (id: string) => api.delete(`/missions/${id}`).then(() => undefined),
};

export const presencesService = USE_MOCKS.presences ? mockApi : httpApi;
