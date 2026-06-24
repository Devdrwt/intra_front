import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supportService } from './service';
import type { CreateTicketInput, Ticket, TicketComment, TicketFilters } from './types';

export function useTickets(filters: TicketFilters = {}) {
  return useQuery({
    queryKey: ['support', 'tickets', filters],
    queryFn: () => supportService.list(filters),
  });
}

export function useTicketStats() {
  return useQuery({ queryKey: ['support', 'stats'], queryFn: supportService.stats });
}

export function useTicket(id: string | undefined) {
  return useQuery({
    queryKey: ['support', 'ticket', id],
    queryFn: () => supportService.get(id as string),
    enabled: !!id,
  });
}

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTicketInput) => supportService.create(input),
    meta: { successMessage: 'Ticket créé' },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['support'] }),
  });
}

export function usePatchTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Ticket> }) =>
      supportService.patch(id, patch),
    meta: { successMessage: 'Ticket mis à jour' },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['support'] }),
  });
}

export function useEscalateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => supportService.escalate(id),
    meta: { successMessage: 'Ticket escaladé' },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['support'] }),
  });
}

export function useAddComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content, type }: { id: string; content: string; type: TicketComment['type'] }) =>
      supportService.addComment(id, content, type),
    meta: { successMessage: 'Commentaire ajouté' },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['support'] }),
  });
}
