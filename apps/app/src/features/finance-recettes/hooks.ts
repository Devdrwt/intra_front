import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { recettesService } from './service';
import type { EncaissementInput, FactureClientInput } from './types';

export function useFacturesClient() {
  return useQuery({ queryKey: ['finance', 'factures-client'], queryFn: recettesService.list });
}
export function useCreateFacture() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: FactureClientInput) => recettesService.create(input),
    meta: { successMessage: 'Facture créée (brouillon)' },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'factures-client'] }),
  });
}
export function useEmettreFacture() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => recettesService.emettre(id),
    meta: { successMessage: 'Facture émise' },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'factures-client'] }),
  });
}
export function useEncaisser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: EncaissementInput }) => recettesService.encaisser(id, input),
    meta: { successMessage: 'Encaissement enregistré' },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'factures-client'] }),
  });
}
