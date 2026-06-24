import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { depensesService } from './service';
import type { ModePaiement, NoteDeFraisInput } from './types';

export function useNotesFrais() {
  return useQuery({ queryKey: ['finance', 'notes-frais'], queryFn: depensesService.listNotes });
}
export function useFacturesFournisseur() {
  return useQuery({ queryKey: ['finance', 'factures-fourn'], queryFn: depensesService.listFactures });
}
export function usePayerFacture() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, montantPaye }: { id: string; montantPaye: number }) => depensesService.payerFacture(id, montantPaye),
    meta: { successMessage: 'Paiement enregistré' },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'factures-fourn'] }),
  });
}
export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NoteDeFraisInput) => depensesService.createNote(input),
    meta: { successMessage: 'Note de frais créée' },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'notes-frais'] }),
  });
}
export function useSoumettreNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => depensesService.soumettre(id),
    meta: { successMessage: 'Note soumise à validation' },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'notes-frais'] }),
  });
}
export function useRembourserNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, modePaiement, paiementRef }: { id: string; modePaiement: ModePaiement; paiementRef: string }) =>
      depensesService.rembourser(id, modePaiement, paiementRef),
    meta: { successMessage: 'Remboursement enregistré' },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'notes-frais'] }),
  });
}
