import { api } from '@/lib/api';
import { USE_MOCKS } from '@/lib/config';
import type { AuditFilters, AuditLog, AuditPage } from './types';

/**
 * Journal d'activité (audit). Endpoint réel : GET /audit-logs (admin, audit:read).
 * Renvoie les actions mutantes journalisées par le backend (qui/quoi/quand).
 */
function cleanParams(f: AuditFilters): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(f)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v as string | number;
  }
  return out;
}

const httpApi = {
  list: (filters: AuditFilters) =>
    api.get<AuditPage>('/audit-logs', { params: cleanParams(filters) }).then((r) => r.data),
};

// --- MOCK (repli hors-ligne) --------------------------------------------------
const delay = <T>(value: T, ms = 200): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

const NOW = '2026-06-03T14:00:00.000Z';
const mockRows: AuditLog[] = [
  { id: 'a1', actorId: 'u1', actorEmail: 'admin@drwintech.com', action: 'POST /api/v1/auth/login', resource: null, method: 'POST', path: '/api/v1/auth/login', ip: '102.0.0.1', statusCode: 200, createdAt: NOW },
  { id: 'a2', actorId: 'u1', actorEmail: 'admin@drwintech.com', action: 'POST /api/v1/rh/employes', resource: 'employes', method: 'POST', path: '/api/v1/rh/employes', ip: '102.0.0.1', statusCode: 201, createdAt: NOW },
  { id: 'a3', actorId: 'u1', actorEmail: 'admin@drwintech.com', action: 'PATCH /api/v1/users/u2', resource: 'users', method: 'PATCH', path: '/api/v1/users/u2', ip: '102.0.0.1', statusCode: 200, createdAt: NOW },
];

const mockApi = {
  list: (filters: AuditFilters) => {
    let rows = mockRows;
    if (filters.q) rows = rows.filter((r) => r.action.toLowerCase().includes(filters.q!.toLowerCase()));
    if (filters.method) rows = rows.filter((r) => r.method === filters.method);
    return delay({ items: rows, total: rows.length, page: filters.page ?? 1, pageSize: filters.pageSize ?? 20 });
  },
};

export const auditService = USE_MOCKS.audit ? mockApi : httpApi;
