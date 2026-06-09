import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tresorerieService } from './service';
import type { MouvementInput } from './types';

export function useComptesTresorerie() {
  return useQuery({ queryKey: ['finance', 'tresorerie', 'comptes'], queryFn: tresorerieService.listComptes });
}
export function useMouvements(compteId?: string) {
  return useQuery({
    queryKey: ['finance', 'tresorerie', 'mouvements', compteId ?? 'all'],
    queryFn: () => tresorerieService.listMouvements(compteId),
  });
}
export function useCreateMouvement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: MouvementInput) => tresorerieService.createMouvement(input),
    meta: { successMessage: 'Mouvement enregistré' },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'tresorerie'] }),
  });
}
export function useRapprocher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tresorerieService.rapprocher(id),
    meta: { successMessage: 'Mouvement rapproché' },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'tresorerie'] }),
  });
}
