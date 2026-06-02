import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { recrutementService } from './service';
import type { CandidatureStatut } from './types';

const KEY = 'recrutement';

export function useCandidatures(statut?: CandidatureStatut) {
  return useQuery({
    queryKey: [KEY, 'candidatures', statut ?? null],
    queryFn: () => recrutementService.listCandidatures(statut),
  });
}

export function useSetCandidatureStatut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, statut }: { id: string; statut: CandidatureStatut }) =>
      recrutementService.setStatut(id, statut),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY, 'candidatures'] }),
  });
}

export function useContactMessages(pending = false) {
  return useQuery({
    queryKey: [KEY, 'contact', pending],
    queryFn: () => recrutementService.listContact(pending),
  });
}

export function useMarkContactTraite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => recrutementService.markTraite(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY, 'contact'] }),
  });
}
