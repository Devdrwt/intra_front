import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { approvalsService } from './service';
import type { DecideInput } from './types';

const INBOX = ['approvals', 'inbox'];
const MINE = ['approvals', 'mine'];

export function useApprovalInbox() {
  return useQuery({ queryKey: INBOX, queryFn: approvalsService.inbox });
}

/** Compteur pour le badge (header / dashboard). */
export function useApprovalInboxCount(): number {
  const { data } = useApprovalInbox();
  return data?.length ?? 0;
}

export function useMyRequests() {
  return useQuery({ queryKey: MINE, queryFn: approvalsService.mine });
}

export function useApprovalRequest(id: string | undefined) {
  return useQuery({
    queryKey: ['approvals', 'detail', id],
    queryFn: () => approvalsService.detail(id as string),
    enabled: !!id,
  });
}

export function useDecide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: DecideInput }) =>
      approvalsService.decide(id, input),
    meta: { successMessage: 'Décision enregistrée' },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['approvals'] }),
  });
}

export function useCancelRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approvalsService.cancel(id),
    meta: { successMessage: 'Demande annulée' },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['approvals'] }),
  });
}
