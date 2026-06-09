import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { financeCoreService } from './service';
import type { TiersInput, TiersType } from './types';

export function useTiers(type?: TiersType) {
  return useQuery({ queryKey: ['finance', 'tiers', type ?? 'all'], queryFn: () => financeCoreService.listTiers(type) });
}
export function useCreateTiers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TiersInput) => financeCoreService.createTiers(input),
    meta: { successMessage: 'Tiers créé' },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'tiers'] }),
  });
}
export function useDeleteTiers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financeCoreService.deleteTiers(id),
    meta: { successMessage: 'Tiers supprimé' },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'tiers'] }),
  });
}

export function useComptes() {
  return useQuery({ queryKey: ['finance', 'comptes'], queryFn: financeCoreService.comptes });
}
export function useJournaux() {
  return useQuery({ queryKey: ['finance', 'journaux'], queryFn: financeCoreService.journaux });
}
export function useTaxes() {
  return useQuery({ queryKey: ['finance', 'taxes'], queryFn: financeCoreService.taxes });
}
export function useExercices() {
  return useQuery({ queryKey: ['finance', 'exercices'], queryFn: financeCoreService.exercices });
}
