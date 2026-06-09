import { api } from '@/lib/api';
import { USE_MOCKS } from '@/lib/config';
import type {
  CreateTicketInput,
  Ticket,
  TicketComment,
  TicketDetail,
  TicketFilters,
} from './types';

/**
 * Service Support/Helpdesk (cf. docs/contracts/support.md).
 * Bascule réelle : VITE_MOCK_SUPPORT=false.
 *   GET  /tickets ?status&priority&type&search&mine
 *   GET  /tickets/:id
 *   POST /tickets
 *   PATCH /tickets/:id  ·  /assign  ·  /escalate
 *   GET/POST /tickets/:id/comments
 */
const delay = <T>(value: T, ms = 160): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

// --- MOCK ---------------------------------------------------------------------
const now = Date.now();
const iso = (h: number) => new Date(now + h * 3_600_000).toISOString();
let seq = 3;

let tickets: TicketDetail[] = [
  {
    id: 't1',
    reference: 'TKT-2026-0001',
    title: 'VPN inaccessible depuis ce matin',
    description: 'Impossible de se connecter au VPN depuis le poste, erreur 800.',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    type: 'INCIDENT',
    category: 'IT',
    tags: ['réseau'],
    reporterId: 'emp-2',
    assigneeId: 'agent-1',
    slaResolutionDueAt: iso(3),
    slaResolutionBreached: false,
    firstResponseAt: iso(-1),
    createdAt: iso(-4),
    updatedAt: iso(-1),
    comments: [
      { id: 'c1', ticketId: 't1', authorId: 'agent-1', content: 'Je regarde ça tout de suite.', type: 'PUBLIC', createdAt: iso(-1) },
    ],
  },
  {
    id: 't2',
    reference: 'TKT-2026-0002',
    title: "Demande d'accès au dossier comptabilité",
    description: 'Merci de m’ouvrir un accès en lecture au partage Compta.',
    status: 'NEW',
    priority: 'NORMAL',
    type: 'REQUEST',
    category: 'Accès',
    tags: [],
    reporterId: 'emp-3',
    slaResolutionDueAt: iso(20),
    slaResolutionBreached: false,
    createdAt: iso(-2),
    updatedAt: iso(-2),
    comments: [],
  },
  {
    id: 't3',
    reference: 'TKT-2026-0003',
    title: 'Imprimante 2e étage en panne',
    description: 'Bourrage papier récurrent, voyant rouge.',
    status: 'RESOLVED',
    priority: 'LOW',
    type: 'INCIDENT',
    category: 'Moyens généraux',
    tags: ['matériel'],
    reporterId: 'emp-4',
    assigneeId: 'agent-2',
    slaResolutionBreached: false,
    resolvedAt: iso(-24),
    createdAt: iso(-50),
    updatedAt: iso(-24),
    comments: [],
  },
];

function matches(t: Ticket, f: TicketFilters): boolean {
  if (f.status && t.status !== f.status) return false;
  if (f.priority && t.priority !== f.priority) return false;
  if (f.type && t.type !== f.type) return false;
  if (f.mine && t.assigneeId !== 'me') return false;
  if (f.search) {
    const q = f.search.toLowerCase();
    if (!`${t.reference} ${t.title} ${t.category ?? ''}`.toLowerCase().includes(q)) return false;
  }
  return true;
}

const strip = ({ comments, description, ...t }: TicketDetail): Ticket => t;

const mockApi = {
  list: (f: TicketFilters = {}) => delay(tickets.filter((t) => matches(t, f)).map(strip)),
  stats: () =>
    delay({
      byStatus: tickets.reduce<Record<string, number>>((acc, t) => {
        acc[t.status] = (acc[t.status] ?? 0) + 1;
        return acc;
      }, {}),
      open: tickets.filter((t) => !['RESOLVED', 'CLOSED'].includes(t.status)).length,
    }),
  get: (id: string) => {
    const t = tickets.find((x) => x.id === id);
    if (!t) return Promise.reject(new Error('Ticket introuvable'));
    return delay(t);
  },
  create: (input: CreateTicketInput) => {
    seq += 1;
    const t: TicketDetail = {
      id: `t${seq}`,
      reference: `TKT-2026-${String(seq).padStart(4, '0')}`,
      title: input.title,
      description: input.description,
      status: 'NEW',
      priority: input.priority ?? 'NORMAL',
      type: input.type ?? 'INCIDENT',
      category: input.category,
      tags: input.tags ?? [],
      reporterId: 'me',
      slaResolutionBreached: false,
      createdAt: iso(0),
      updatedAt: iso(0),
      comments: [],
    };
    tickets = [t, ...tickets];
    return delay(strip(t));
  },
  patch: (id: string, patch: Partial<Ticket>) => {
    tickets = tickets.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: iso(0) } : t));
    return mockApi.get(id);
  },
  escalate: (id: string) => mockApi.patch(id, { status: 'ESCALATED' }),
  addComment: (id: string, content: string, type: TicketComment['type']) => {
    const comment: TicketComment = {
      id: `c${Date.now()}`,
      ticketId: id,
      authorId: 'me',
      content,
      type,
      createdAt: iso(0),
    };
    tickets = tickets.map((t) =>
      t.id === id ? { ...t, comments: [...t.comments, comment], firstResponseAt: t.firstResponseAt ?? iso(0) } : t,
    );
    return delay(comment);
  },
};

// --- HTTP ---------------------------------------------------------------------
function buildParams(f: TicketFilters): Record<string, string | boolean> {
  const p: Record<string, string | boolean> = {};
  if (f.status) p.status = f.status;
  if (f.priority) p.priority = f.priority;
  if (f.type) p.type = f.type;
  if (f.search) p.search = f.search;
  if (f.mine) p.mine = true;
  return p;
}

const httpApi = {
  list: (f: TicketFilters = {}) =>
    api.get<Ticket[]>('/tickets', { params: buildParams(f) }).then((r) => r.data),
  stats: () => api.get('/tickets/stats').then((r) => r.data),
  get: (id: string) => api.get<TicketDetail>(`/tickets/${id}`).then((r) => r.data),
  create: (input: CreateTicketInput) => api.post<Ticket>('/tickets', input).then((r) => r.data),
  patch: (id: string, patch: Partial<Ticket>) =>
    api.patch<TicketDetail>(`/tickets/${id}`, patch).then((r) => r.data),
  escalate: (id: string) =>
    api.patch<TicketDetail>(`/tickets/${id}/escalate`).then((r) => r.data),
  addComment: (id: string, content: string, type: TicketComment['type']) =>
    api.post<TicketComment>(`/tickets/${id}/comments`, { content, type }).then((r) => r.data),
};

export const supportService = USE_MOCKS.support ? mockApi : httpApi;
