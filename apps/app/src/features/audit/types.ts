/** Entrée du journal d'activité (audit_logs backend). */
export interface AuditLog {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  action: string; // ex: "POST /api/v1/rh/employes"
  resource: string | null;
  method: string | null; // POST | PUT | PATCH | DELETE
  path: string | null;
  ip: string | null;
  statusCode: number | null;
  createdAt: string; // ISO
}

export interface AuditPage {
  items: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AuditFilters {
  page?: number;
  pageSize?: number;
  q?: string;
  method?: string;
  from?: string;
  to?: string;
}

export const METHOD_OPTIONS = [
  { value: '', label: 'Toutes les méthodes' },
  { value: 'POST', label: 'Création (POST)' },
  { value: 'PUT', label: 'Mise à jour (PUT)' },
  { value: 'PATCH', label: 'Modification (PATCH)' },
  { value: 'DELETE', label: 'Suppression (DELETE)' },
];

export const METHOD_TONE: Record<string, 'success' | 'warning' | 'danger' | 'brand' | 'neutral'> = {
  POST: 'success',
  PUT: 'warning',
  PATCH: 'warning',
  DELETE: 'danger',
};
