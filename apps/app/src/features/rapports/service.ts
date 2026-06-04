import { api } from '@/lib/api';
import { USE_MOCKS } from '@/lib/config';
import { MOCK_EMPLOYES } from '@/features/rh/mock';
import type {
  AttachmentRef,
  CheckMissingResult,
  ConsolidationLigne,
  ConsolidationQuery,
  Rapport,
  RapportFilters,
  RapportInput,
} from './types';

/**
 * Service Reporting. MOCK par défaut ; API NestJS avec `VITE_MOCK_RAPPORTS=false`.
 * Endpoints (intra_back, module rapports) :
 *   GET  /rapports?date&employeId&statut
 *   GET  /rapports/consolidation?from&to&groupBy=service|departement
 *   GET  /rapports/:id
 *   PUT  /rapports                      (upsert self-service)
 *   POST /rapports/check-missing        { date? }
 */
const today = () => new Date().toISOString().slice(0, 10);
const delay = <T>(value: T, ms = 200): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

// --- MOCK ---------------------------------------------------------------------
let store: Rapport[] = [
  {
    id: 'r1',
    employeId: 'e1',
    date: today(),
    contenu: 'Entretiens de recrutement + mise à jour des dossiers du personnel.',
    statut: 'SOUMIS',
    submittedAt: new Date().toISOString(),
  },
  {
    id: 'r2',
    employeId: 'e2',
    date: today(),
    contenu: 'Développement du module de pointage (front).',
    statut: 'BROUILLON',
  },
];
let seq = store.length;

function applyFilters(list: Rapport[], f: RapportFilters): Rapport[] {
  return list.filter((r) => {
    if (f.date && r.date !== f.date) return false;
    if (f.employeId && r.employeId !== f.employeId) return false;
    if (f.statut && r.statut !== f.statut) return false;
    return true;
  });
}

const mockApi = {
  list: (filters: RapportFilters) =>
    delay(applyFilters(store, filters).sort((a, b) => b.date.localeCompare(a.date))),
  get: (id: string) => delay(store.find((r) => r.id === id) ?? null),
  upsert: (input: RapportInput) => {
    const date = input.date ?? today();
    const submitting = input.statut === 'SOUMIS';
    const existing = store.find((r) => r.employeId === input.employeId && r.date === date);
    if (existing) {
      existing.contenu = input.contenu;
      existing.statut = input.statut ?? existing.statut;
      if (submitting && !existing.submittedAt) existing.submittedAt = new Date().toISOString();
      return delay({ ...existing });
    }
    const created: Rapport = {
      id: `r${++seq}`,
      employeId: input.employeId,
      date,
      contenu: input.contenu,
      statut: input.statut ?? 'BROUILLON',
      submittedAt: submitting ? new Date().toISOString() : undefined,
    };
    store = [created, ...store];
    return delay(created);
  },
  consolidation: (q: ConsolidationQuery): Promise<ConsolidationLigne[]> => {
    const jours = Math.max(
      1,
      Math.round((new Date(q.to).getTime() - new Date(q.from).getTime()) / 86_400_000) + 1,
    );
    const key = q.groupBy;
    const lignes = new Map<string, ConsolidationLigne>();
    const ensure = (g: string) => {
      let l = lignes.get(g);
      if (!l) {
        l = { groupe: g, employesActifs: 0, rapportsSoumis: 0, joursPeriode: jours, taux: 0 };
        lignes.set(g, l);
      }
      return l;
    };
    const empById = new Map(MOCK_EMPLOYES.map((e) => [e.id, e]));
    for (const e of MOCK_EMPLOYES) {
      if (e.statut === 'ACTIF') ensure((e[key] ?? '—') as string).employesActifs += 1;
    }
    for (const r of store) {
      if (r.statut !== 'SOUMIS' || r.date < q.from || r.date > q.to) continue;
      const e = empById.get(r.employeId);
      if (e) ensure((e[key] ?? '—') as string).rapportsSoumis += 1;
    }
    for (const l of lignes.values()) {
      const attendus = l.employesActifs * l.joursPeriode;
      l.taux = attendus > 0 ? Math.round((l.rapportsSoumis / attendus) * 100) / 100 : 0;
    }
    return delay(Array.from(lignes.values()).sort((a, b) => a.groupe.localeCompare(b.groupe)));
  },
  checkMissing: (date?: string): Promise<CheckMissingResult> => {
    const d = date ?? today();
    const soumis = new Set(store.filter((r) => r.date === d && r.statut === 'SOUMIS').map((r) => r.employeId));
    const manquants = MOCK_EMPLOYES.filter((e) => e.statut === 'ACTIF' && !soumis.has(e.id)).length;
    return delay({ date: d, manquants });
  },
  uploadAttachment: (file: File): Promise<AttachmentRef> =>
    delay({ key: `rapports/mock-${++seq}`, name: file.name, size: file.size, type: file.type }),
  downloadAttachment: (_id: string): Promise<Blob> => delay(new Blob(['mock'])),
};

// --- HTTP (NestJS) ------------------------------------------------------------
const httpApi = {
  list: (filters: RapportFilters) => {
    const params: Record<string, string> = {};
    if (filters.date) params.date = filters.date;
    if (filters.employeId) params.employeId = filters.employeId;
    if (filters.statut) params.statut = filters.statut;
    return api.get<Rapport[]>('/rapports', { params }).then((r) => r.data);
  },
  get: (id: string) => api.get<Rapport>(`/rapports/${id}`).then((r) => r.data),
  upsert: (input: RapportInput) => api.put<Rapport>('/rapports', input).then((r) => r.data),
  consolidation: (q: ConsolidationQuery) =>
    api.get<ConsolidationLigne[]>('/rapports/consolidation', { params: q }).then((r) => r.data),
  checkMissing: (date?: string) =>
    api.post<CheckMissingResult>('/rapports/check-missing', { date }).then((r) => r.data),
  uploadAttachment: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post<AttachmentRef>('/rapports/attachment', fd).then((r) => r.data);
  },
  downloadAttachment: (id: string) =>
    api.get(`/rapports/${id}/attachment`, { responseType: 'blob' }).then((r) => r.data as Blob),
};

export const rapportsService = USE_MOCKS.rapports ? mockApi : httpApi;
