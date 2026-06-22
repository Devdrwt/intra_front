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
  // Champs complets (présents via GET /tasks?mine=true) :
  description?: string;
  projetId?: string;
  parentTaskId?: string;
  assigneeId?: string;
  estimationMinutes?: number;
  progression?: number;
  position?: number;
  labels?: string[];
  createdAt?: string;
  updatedAt?: string;
}

/** Entrée création/mise à jour d'une tâche. */
export interface TaskInput {
  titre?: string;
  description?: string;
  statut?: TaskStatus;
  priorite?: TaskPriority;
  dateEcheance?: string | null;
  labels?: string[];
  progression?: number;
  assigneeId?: string;
  projetId?: string;
  parentTaskId?: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  authorNom?: string;
  body: string;
  createdAt: string;
}

const delay = <T>(value: T, ms = 140): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

// --- MOCK ---------------------------------------------------------------------
let seq = 4;
let tasks: Task[] = [
  { id: 't1', reference: 'TSK-2026-0001', titre: 'Relancer client SOBEBRA', statut: 'TODO', priorite: 'HIGH', dateEcheance: new Date().toISOString().slice(0, 10), projetNom: 'Recouvrement', progression: 0, labels: ['commercial'] },
  { id: 't2', reference: 'TSK-2026-0002', titre: 'Préparer rapport mensuel', statut: 'IN_PROGRESS', priorite: 'MEDIUM', projetNom: 'Reporting', progression: 40, labels: [] },
  { id: 't3', reference: 'TSK-2026-0003', titre: 'Revue maquette intranet', statut: 'IN_REVIEW', priorite: 'MEDIUM', projetNom: 'Refonte intranet', progression: 80, labels: ['design'] },
  { id: 't4', reference: 'TSK-2026-0004', titre: 'Configurer le VPN', statut: 'DONE', priorite: 'LOW', progression: 100, labels: [] },
];

const mockApi = {
  myTasks: () => delay([...tasks]),
  list: () => delay([...tasks]),
  create: (titre: string, priorite: TaskPriority) => mockApi.createFull({ titre, priorite }),
  createFull: (input: TaskInput) => {
    seq += 1;
    const t: Task = {
      id: `t${seq}`,
      reference: `TSK-2026-${String(seq).padStart(4, '0')}`,
      titre: input.titre ?? 'Nouvelle tâche',
      statut: input.statut ?? 'TODO',
      priorite: input.priorite ?? 'MEDIUM',
      dateEcheance: input.dateEcheance ?? undefined,
      labels: input.labels ?? [],
      progression: 0,
      description: input.description,
    };
    tasks = [t, ...tasks];
    return delay(t);
  },
  update: (id: string, input: TaskInput) => {
    tasks = tasks.map((t) =>
      t.id === id ? { ...t, ...input, dateEcheance: input.dateEcheance ?? t.dateEcheance } : t,
    );
    return delay(tasks.find((t) => t.id === id)!);
  },
  move: (id: string, statut: TaskStatus) => {
    tasks = tasks.map((t) => (t.id === id ? { ...t, statut, progression: statut === 'DONE' ? 100 : t.progression } : t));
    return delay(tasks.find((t) => t.id === id)!);
  },
  remove: (id: string) => {
    tasks = tasks.filter((t) => t.id !== id);
    return delay(undefined);
  },
  subtasks: (_parentId: string) => delay([] as Task[]),
  comments: (_taskId: string) => delay([] as TaskComment[]),
  addComment: (taskId: string, body: string) =>
    delay({ id: `c${seq++}`, taskId, authorId: 'me', authorNom: 'Moi', body, createdAt: new Date().toISOString() }),
  removeComment: (_id: string) => delay(undefined),
};

// --- HTTP ---------------------------------------------------------------------
const httpApi = {
  myTasks: () => api.get<Task[]>('/me/tasks').then((r) => r.data),
  list: () => api.get<Task[]>('/tasks', { params: { mine: 'true' } }).then((r) => r.data),
  create: (titre: string, priorite: TaskPriority) =>
    api.post<Task>('/tasks', { titre, priorite }).then((r) => r.data),
  createFull: (input: TaskInput) => api.post<Task>('/tasks', input).then((r) => r.data),
  update: (id: string, input: TaskInput) =>
    api.patch<Task>(`/tasks/${id}`, input).then((r) => r.data),
  move: (id: string, statut: TaskStatus) =>
    api.patch<Task>(`/tasks/${id}/move`, { statut, position: 0 }).then((r) => r.data),
  remove: (id: string) => api.delete(`/tasks/${id}`).then(() => undefined),
  subtasks: (parentId: string) =>
    api.get<Task[]>('/tasks', { params: { parentTaskId: parentId } }).then((r) => r.data),
  comments: (taskId: string) =>
    api.get<TaskComment[]>(`/tasks/${taskId}/comments`).then((r) => r.data),
  addComment: (taskId: string, body: string) =>
    api.post<TaskComment>(`/tasks/${taskId}/comments`, { body }).then((r) => r.data),
  removeComment: (id: string) => api.delete(`/tasks/comments/${id}`).then(() => undefined),
};

export const tasksService = USE_MOCKS.projects ? mockApi : httpApi;
