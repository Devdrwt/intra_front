import { api } from '@/lib/api';
import { USE_MOCKS } from '@/lib/config';
import type { Department, DepartmentInput, Service, ServiceInput } from './types';

/**
 * Service Référentiels (départements & services). MOCK par défaut tant que le backend
 * n'expose pas /departments & /services (cf. docs/contracts/referentiels.md).
 * Bascule réelle : VITE_MOCK_SETTINGS=false.
 */
const delay = <T>(value: T, ms = 150): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

// --- MOCK ---------------------------------------------------------------------
// Persisté en localStorage pour survivre aux rechargements (dev). Le vrai backend
// remplacera ce stockage via VITE_MOCK_SETTINGS=false.
const LS_KEY = 'drwindesk.referentiels';

const SEED_DEPARTMENTS: Department[] = [
  { id: 'd1', name: 'Administration' },
  { id: 'd2', name: 'Production' },
  { id: 'd3', name: 'Commercial' },
  { id: 'd4', name: 'Direction' },
];
const SEED_SERVICES: Service[] = [
  { id: 's1', name: 'Ressources Humaines', departmentId: 'd1' },
  { id: 's2', name: 'Ingénierie', departmentId: 'd2' },
  { id: 's3', name: 'Design', departmentId: 'd2' },
];

function loadStore(): { departments: Department[]; services: Service[] } {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as { departments: Department[]; services: Service[] };
  } catch {
    /* ignore */
  }
  return { departments: SEED_DEPARTMENTS, services: SEED_SERVICES };
}

const initial = loadStore();
let departments: Department[] = initial.departments;
let services: Service[] = initial.services;
let seq = 100;

function persist() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ departments, services }));
  } catch {
    /* ignore */
  }
}

const mockApi = {
  listDepartments: () => delay([...departments].sort((a, b) => a.name.localeCompare(b.name))),
  createDepartment: (input: DepartmentInput) => {
    const d: Department = { id: `d${++seq}`, name: input.name.trim() };
    departments = [...departments, d];
    persist();
    return delay(d);
  },
  deleteDepartment: (id: string) => {
    departments = departments.filter((d) => d.id !== id);
    services = services.map((s) => (s.departmentId === id ? { ...s, departmentId: undefined } : s));
    persist();
    return delay(undefined);
  },
  listServices: () => delay([...services].sort((a, b) => a.name.localeCompare(b.name))),
  createService: (input: ServiceInput) => {
    const s: Service = { id: `s${++seq}`, name: input.name.trim(), departmentId: input.departmentId };
    services = [...services, s];
    persist();
    return delay(s);
  },
  deleteService: (id: string) => {
    services = services.filter((s) => s.id !== id);
    persist();
    return delay(undefined);
  },
};

// --- HTTP (NestJS — à brancher quand dispo) -----------------------------------
const httpApi = {
  listDepartments: () => api.get<Department[]>('/departments').then((r) => r.data),
  createDepartment: (input: DepartmentInput) =>
    api.post<Department>('/departments', input).then((r) => r.data),
  deleteDepartment: (id: string) => api.delete(`/departments/${id}`).then(() => undefined),
  listServices: () => api.get<Service[]>('/services').then((r) => r.data),
  createService: (input: ServiceInput) => api.post<Service>('/services', input).then((r) => r.data),
  deleteService: (id: string) => api.delete(`/services/${id}`).then(() => undefined),
};

export const settingsService = USE_MOCKS.settings ? mockApi : httpApi;
