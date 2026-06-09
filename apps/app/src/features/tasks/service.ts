import { api } from '@/lib/api';
import { USE_MOCKS } from '@/lib/config';

/**
 * Projets : Tâches & Kanban (cf. docs/contracts/projets-taches.md).
 * Utilise le flag VITE_MOCK_PROJECTS. /me/tasks · /tasks · /tasks/:id/move
 */
export type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELLED';
export type TaskPriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface Task {
  id: string;
  reference: string;
  titre: string;
  statut: TaskStatus;
  priorite: TaskPriority;
  dateEcheance?: string;
  projetNom?: string;
}

const delay = <T>(value: T, ms = 140): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

// --- MOCK ---------------------------------------------------------------------
let seq = 4;
let tasks: Task[] = [
  { id: 't1', reference: 'TSK-2026-0001', titre: 'Relancer client SOBEBRA', statut: 'TODO', priorite: 'HIGH', dateEcheance: new Date().toISOString().slice(0, 10), projetNom: 'Recouvrement' },
  { id: 't2', reference: 'TSK-2026-0002', titre: 'Préparer rapport mensuel', statut: 'IN_PROGRESS', priorite: 'MEDIUM', projetNom: 'Reporting' },
  { id: 't3', reference: 'TSK-2026-0003', titre: 'Revue maquette intranet', statut: 'IN_REVIEW', priorite: 'MEDIUM', projetNom: 'Refonte intranet' },
  { id: 't4', reference: 'TSK-2026-0004', titre: 'Configurer le VPN', statut: 'DONE', priorite: 'LOW' },
];

const mockApi = {
  myTasks: () => delay([...tasks]),
  create: (titre: string, priorite: TaskPriority) => {
    seq += 1;
    const t: Task = { id: `t${seq}`, reference: `TSK-2026-${String(seq).padStart(4, '0')}`, titre, statut: 'TODO', priorite };
    tasks = [t, ...tasks];
    return delay(t);
  },
  move: (id: string, statut: TaskStatus) => {
    tasks = tasks.map((t) => (t.id === id ? { ...t, statut } : t));
    return delay(tasks.find((t) => t.id === id)!);
  },
};

// --- HTTP ---------------------------------------------------------------------
const httpApi = {
  myTasks: () => api.get<Task[]>('/me/tasks').then((r) => r.data),
  create: (titre: string, priorite: TaskPriority) =>
    api.post<Task>('/tasks', { titre, priorite }).then((r) => r.data),
  move: (id: string, statut: TaskStatus) =>
    api.patch<Task>(`/tasks/${id}/move`, { statut, position: 0 }).then((r) => r.data),
};

export const tasksService = USE_MOCKS.projects ? mockApi : httpApi;
