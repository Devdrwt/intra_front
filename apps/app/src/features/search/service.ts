import { api } from '@/lib/api';
import { USE_MOCKS } from '@/lib/config';

/**
 * Recherche globale (cf. docs/contracts/recherche.md).
 * Bascule réelle : VITE_MOCK_SEARCH=false → GET /search?q=&types=&limit=
 * Les résultats sont déjà filtrés par permissions côté serveur.
 */
export interface SearchHit {
  type: string;
  entityId: string;
  title: string;
  subtitle?: string;
  url: string;
}
export interface SearchGroup {
  type: string;
  label: string;
  items: SearchHit[];
}
export interface SearchResponse {
  query: string;
  groups: SearchGroup[];
}

const delay = <T>(value: T, ms = 120): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

// --- MOCK ---------------------------------------------------------------------
const CORPUS: SearchHit[] = [
  { type: 'employe', entityId: 'e1', title: 'Awa Koffi', subtitle: 'Développeuse · IT', url: '/rh/e1' },
  { type: 'employe', entityId: 'e2', title: 'Jean Dupont', subtitle: 'Comptable · Finance', url: '/rh/e2' },
  { type: 'ticket', entityId: 't1', title: 'TKT-2026-0001 — VPN inaccessible', subtitle: 'Priorité haute', url: '/support/t1' },
  { type: 'ticket', entityId: 't2', title: "TKT-2026-0002 — Accès dossier compta", subtitle: 'Nouveau', url: '/support/t2' },
  { type: 'document', entityId: 'd1', title: 'Contrat CDI — Awa Koffi', subtitle: 'GED', url: '/documents' },
  { type: 'projet', entityId: 'p1', title: 'Refonte intranet', subtitle: 'En cours', url: '/projets/p1' },
];

const GROUP_LABEL: Record<string, string> = {
  employe: 'Employés',
  ticket: 'Tickets',
  document: 'Documents',
  projet: 'Projets',
  task: 'Tâches',
  tiers: 'Tiers',
};

function group(hits: SearchHit[]): SearchGroup[] {
  const byType = new Map<string, SearchHit[]>();
  for (const h of hits) {
    const arr = byType.get(h.type) ?? [];
    arr.push(h);
    byType.set(h.type, arr);
  }
  return [...byType.entries()].map(([type, items]) => ({
    type,
    label: GROUP_LABEL[type] ?? type,
    items,
  }));
}

const mockApi = {
  query: (q: string, types?: string[]): Promise<SearchResponse> => {
    const needle = q.trim().toLowerCase();
    if (needle.length < 2) return delay({ query: q, groups: [] });
    const hits = CORPUS.filter(
      (h) =>
        (!types || types.includes(h.type)) &&
        `${h.title} ${h.subtitle ?? ''}`.toLowerCase().includes(needle),
    );
    return delay({ query: q, groups: group(hits) });
  },
};

// --- HTTP ---------------------------------------------------------------------
const httpApi = {
  query: (q: string, types?: string[]): Promise<SearchResponse> =>
    api
      .get<SearchResponse>('/search', {
        params: { q, ...(types?.length ? { types: types.join(',') } : {}), limit: 6 },
      })
      .then((r) => r.data),
};

export const searchService = USE_MOCKS.search ? mockApi : httpApi;
