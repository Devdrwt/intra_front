import { api } from '@/lib/api';
import { USE_MOCKS } from '@/lib/config';
import type { EspaceMoi, Notification } from './types';

/**
 * Service Espaces & Alertes. MOCK par défaut ; API NestJS avec `VITE_MOCK_ESPACES=false`.
 * Endpoints (intra_back, module espaces) :
 *   GET   /espaces/moi                 → tableau de bord perso { user, notifications:{unread,recent} }
 *   GET   /notifications?unread=true   → NotificationDto[]
 *   GET   /notifications/unread-count  → { count }
 *   PATCH /notifications/:id/read      → 204
 *   POST  /notifications/read-all      → { updated }
 */
const delay = <T>(value: T, ms = 200): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

// --- MOCK ---------------------------------------------------------------------
let store: Notification[] = [
  {
    id: 'n1',
    kind: 'report.missing',
    severity: 'WARNING',
    title: 'Rapport journalier non remis',
    body: 'Votre rapport du jour n’a pas encore été soumis.',
    read: false,
    createdAt: new Date(Date.now() - 3_600_000).toISOString(),
  },
  {
    id: 'n2',
    kind: 'contract.expiring',
    severity: 'CRITICAL',
    title: 'Contrat à échéance',
    body: 'Le contrat de Sarah Houngbedji expire dans 30 jours.',
    read: false,
    createdAt: new Date(Date.now() - 7_200_000).toISOString(),
  },
  {
    id: 'n3',
    kind: 'conge.approved',
    severity: 'INFO',
    title: 'Demande de congé approuvée',
    body: 'Votre congé du 20 au 22 mai a été approuvé.',
    read: true,
    createdAt: new Date(Date.now() - 86_400_000).toISOString(),
  },
];

const mockApi = {
  espaceMoi: (): Promise<EspaceMoi> =>
    delay({
      user: { id: 'u1', email: 'admin@drwintech.com', roles: ['admin'] },
      notifications: {
        unread: store.filter((n) => !n.read).length,
        recent: [...store].slice(0, 5),
      },
    }),
  list: (unreadOnly = false) =>
    delay(unreadOnly ? store.filter((n) => !n.read) : [...store]),
  unreadCount: () => delay({ count: store.filter((n) => !n.read).length }),
  markRead: (id: string) => {
    store = store.map((n) => (n.id === id ? { ...n, read: true } : n));
    return delay(undefined);
  },
  markAllRead: () => {
    const updated = store.filter((n) => !n.read).length;
    store = store.map((n) => ({ ...n, read: true }));
    return delay({ updated });
  },
};

// --- HTTP (NestJS) ------------------------------------------------------------
const httpApi = {
  espaceMoi: () => api.get<EspaceMoi>('/espaces/moi').then((r) => r.data),
  list: (unreadOnly = false) =>
    api
      .get<Notification[]>('/notifications', {
        params: unreadOnly ? { unread: 'true' } : {},
      })
      .then((r) => r.data),
  unreadCount: () =>
    api.get<{ count: number }>('/notifications/unread-count').then((r) => r.data),
  markRead: (id: string) =>
    api.patch(`/notifications/${id}/read`).then(() => undefined),
  markAllRead: () =>
    api.post<{ updated: number }>('/notifications/read-all').then((r) => r.data),
};

export const espacesService = USE_MOCKS.espaces ? mockApi : httpApi;
