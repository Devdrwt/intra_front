// --- Support / Helpdesk (cf. docs/contracts/support.md) ------------------------

export type TicketStatus =
  | 'NEW'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'ESCALATED'
  | 'RESOLVED'
  | 'CLOSED';
export type TicketPriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';
export type TicketType = 'INCIDENT' | 'REQUEST' | 'CHANGE' | 'QUESTION';
export type TicketCommentType = 'PUBLIC' | 'INTERNAL' | 'SYSTEM';

export interface Ticket {
  id: string;
  reference: string; // "TKT-2026-0001"
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  type: TicketType;
  category?: string;
  tags: string[];
  reporterId?: string;
  assigneeId?: string;
  slaResolutionDueAt?: string;
  slaResolutionBreached: boolean;
  firstResponseAt?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  authorId?: string;
  content: string;
  type: TicketCommentType;
  createdAt: string;
}

export interface TicketDetail extends Ticket {
  description: string;
  comments: TicketComment[];
}

export interface CreateTicketInput {
  title: string;
  description: string;
  priority?: TicketPriority;
  type?: TicketType;
  category?: string;
  tags?: string[];
}

export interface TicketFilters {
  status?: TicketStatus | '';
  priority?: TicketPriority | '';
  type?: TicketType | '';
  search?: string;
  mine?: boolean;
}

// --- Libellés -----------------------------------------------------------------

export const STATUS_LABEL: Record<TicketStatus, string> = {
  NEW: 'Nouveau',
  ASSIGNED: 'Assigné',
  IN_PROGRESS: 'En cours',
  ON_HOLD: 'En attente',
  ESCALATED: 'Escaladé',
  RESOLVED: 'Résolu',
  CLOSED: 'Clos',
};

export const PRIORITY_LABEL: Record<TicketPriority, string> = {
  CRITICAL: 'Critique',
  HIGH: 'Haute',
  NORMAL: 'Normale',
  LOW: 'Basse',
};

export const TYPE_LABEL: Record<TicketType, string> = {
  INCIDENT: 'Incident',
  REQUEST: 'Demande',
  CHANGE: 'Changement',
  QUESTION: 'Question',
};

export const STATUS_OPTIONS = (Object.keys(STATUS_LABEL) as TicketStatus[]).map((value) => ({
  value,
  label: STATUS_LABEL[value],
}));
export const PRIORITY_OPTIONS = (Object.keys(PRIORITY_LABEL) as TicketPriority[]).map((value) => ({
  value,
  label: PRIORITY_LABEL[value],
}));
export const TYPE_OPTIONS = (Object.keys(TYPE_LABEL) as TicketType[]).map((value) => ({
  value,
  label: TYPE_LABEL[value],
}));
