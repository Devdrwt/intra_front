import { api } from '@/lib/api';
import { USE_MOCKS } from '@/lib/config';
import type {
  ApprovalRequest,
  ApprovalRequestDetail,
  ApprovalTask,
  DecideInput,
} from './types';

/**
 * Service Approbations (cf. docs/contracts/approbations.md).
 * MOCK par défaut tant que le backend n'expose pas /approvals.
 * Bascule réelle : VITE_MOCK_APPROVALS=false.
 *   GET  /approvals/inbox       -> ApprovalTask[]   (mes validations en attente)
 *   GET  /approvals/mine        -> ApprovalRequest[] (mes demandes émises)
 *   GET  /approvals/:id         -> ApprovalRequestDetail
 *   POST /approvals/:id/decide  { action, comment? }
 *   POST /approvals/:id/cancel
 */
const delay = <T>(value: T, ms = 160): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

// --- MOCK ---------------------------------------------------------------------
const now = Date.now();
const iso = (deltaH: number) => new Date(now + deltaH * 3_600_000).toISOString();

let mInbox: ApprovalTask[] = [
  {
    requestId: 'ar1',
    entityType: 'ABSENCE',
    label: 'Congé 5j — Awa Koffi',
    stepName: 'Validation manager',
    requesterId: 'emp-2',
    startedAt: iso(-20),
    slaDueAt: iso(4),
  },
  {
    requestId: 'ar2',
    entityType: 'EXPENSE',
    label: 'Note de frais 45 000 F — Jean Dupont',
    stepName: 'Visa comptable',
    requesterId: 'emp-3',
    startedAt: iso(-3),
  },
  {
    requestId: 'ar3',
    entityType: 'PURCHASE',
    label: "Demande d'achat 1 200 000 F — Service IT",
    stepName: 'Validation direction',
    requesterId: 'emp-4',
    startedAt: iso(-48),
    slaDueAt: iso(-2),
  },
];

let mMine: ApprovalRequest[] = [
  {
    id: 'ar9',
    flowId: 'f-abs',
    entityType: 'ABSENCE',
    entityId: 'abs-9',
    requesterId: 'me',
    status: 'PENDING',
    currentOrder: 2,
    label: 'Permission 1/2 journée — moi',
    startedAt: iso(-6),
  },
  {
    id: 'ar8',
    flowId: 'f-exp',
    entityType: 'EXPENSE',
    entityId: 'exp-8',
    requesterId: 'me',
    status: 'APPROVED',
    currentOrder: 2,
    label: 'Note de frais 18 000 F — moi',
    startedAt: iso(-72),
    completedAt: iso(-70),
  },
];

const detailFor = (id: string): ApprovalRequestDetail => {
  const task = mInbox.find((t) => t.requestId === id);
  const mine = mMine.find((r) => r.id === id);
  const base: ApprovalRequest =
    mine ??
    (task
      ? {
          id: task.requestId,
          flowId: 'f',
          entityType: task.entityType,
          entityId: task.requestId,
          requesterId: task.requesterId,
          status: 'PENDING',
          currentOrder: 1,
          label: task.label,
          startedAt: task.startedAt,
        }
      : {
          id,
          flowId: 'f',
          entityType: 'GENERIC',
          entityId: id,
          requesterId: 'unknown',
          status: 'PENDING',
          currentOrder: 1,
          startedAt: iso(0),
        });
  return {
    ...base,
    steps: [
      { order: 1, name: 'Validation manager', approverType: 'MANAGER', status: base.currentOrder > 1 ? 'done' : 'current' },
      { order: 2, name: 'Visa RH / Finance', approverType: 'ROLE', status: base.status === 'APPROVED' ? 'done' : base.currentOrder >= 2 ? 'current' : 'pending' },
    ],
    decisions:
      base.currentOrder > 1 || base.status !== 'PENDING'
        ? [
            {
              stepName: 'Validation manager',
              approverId: 'mgr-1',
              action: 'APPROVE',
              comment: 'OK pour moi.',
              decidedAt: iso(-2),
            },
          ]
        : [],
  };
};

const mockApi = {
  inbox: () => delay([...mInbox]),
  mine: () => delay([...mMine]),
  detail: (id: string) => delay(detailFor(id)),
  decide: (id: string, input: DecideInput) => {
    mInbox = mInbox.filter((t) => t.requestId !== id || input.action === 'COMMENT');
    return delay(detailFor(id));
  },
  cancel: (id: string) => {
    mMine = mMine.map((r) => (r.id === id ? { ...r, status: 'CANCELLED' as const } : r));
    return delay(detailFor(id));
  },
};

// --- HTTP ---------------------------------------------------------------------
const httpApi = {
  inbox: () => api.get<ApprovalTask[]>('/approvals/inbox').then((r) => r.data),
  mine: () => api.get<ApprovalRequest[]>('/approvals/mine').then((r) => r.data),
  detail: (id: string) => api.get<ApprovalRequestDetail>(`/approvals/${id}`).then((r) => r.data),
  decide: (id: string, input: DecideInput) =>
    api.post<ApprovalRequest>(`/approvals/${id}/decide`, input).then((r) => r.data),
  cancel: (id: string) => api.post<ApprovalRequest>(`/approvals/${id}/cancel`).then((r) => r.data),
};

export const approvalsService = USE_MOCKS.approvals ? mockApi : httpApi;
