// --- Moteur d'approbations (cf. docs/contracts/approbations.md) ----------------

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type ApprovableType = 'ABSENCE' | 'EXPENSE' | 'PURCHASE' | 'DOCUMENT' | 'TICKET' | 'GENERIC';
export type DecisionAction = 'APPROVE' | 'REJECT' | 'COMMENT';

/** Une ligne de l'inbox validateur. */
export interface ApprovalTask {
  requestId: string;
  entityType: ApprovableType;
  label: string; // "Congé 5j — J. Dupont"
  stepName: string; // "Validation manager"
  requesterId: string;
  startedAt: string; // ISO
  slaDueAt?: string;
}

export interface ApprovalRequest {
  id: string;
  flowId: string;
  entityType: ApprovableType;
  entityId: string;
  requesterId: string;
  status: ApprovalStatus;
  currentOrder: number;
  label?: string;
  startedAt: string;
  completedAt?: string;
}

export type StepState = 'done' | 'current' | 'pending' | 'skipped';

export interface ApprovalStepView {
  order: number;
  name: string;
  approverType: string;
  status: StepState;
}

export interface ApprovalDecisionView {
  stepName: string;
  approverId: string;
  action: string;
  comment?: string;
  decidedAt: string;
}

export interface ApprovalRequestDetail extends ApprovalRequest {
  steps: ApprovalStepView[];
  decisions: ApprovalDecisionView[];
}

export interface DecideInput {
  action: DecisionAction;
  comment?: string;
}

// --- Libellés -----------------------------------------------------------------

export const ENTITY_LABEL: Record<ApprovableType, string> = {
  ABSENCE: 'Absence',
  EXPENSE: 'Note de frais',
  PURCHASE: "Demande d'achat",
  DOCUMENT: 'Document',
  TICKET: 'Ticket',
  GENERIC: 'Demande',
};

export const STATUS_LABEL: Record<ApprovalStatus, string> = {
  PENDING: 'En cours',
  APPROVED: 'Approuvée',
  REJECTED: 'Rejetée',
  CANCELLED: 'Annulée',
};
