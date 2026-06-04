import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { meService, type MeCongeInput, type MeRapportInput } from './service';

const ME = 'me';

export function useMyEmploye() {
  return useQuery({
    queryKey: [ME, 'employe'],
    queryFn: meService.myEmploye,
    retry: false, // 404 = compte non rattaché à une fiche → on affiche un message dédié
  });
}

export function useMyPointages() {
  return useQuery({ queryKey: [ME, 'pointages'], queryFn: meService.myPointages });
}

export function useMePointer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sens: 'ENTREE' | 'SORTIE') => meService.pointer(sens),
    meta: { successMessage: 'Pointage enregistré' },
    onSuccess: () => qc.invalidateQueries({ queryKey: [ME, 'pointages'] }),
  });
}

export function useMyConges() {
  return useQuery({ queryKey: [ME, 'conges'], queryFn: meService.myConges });
}

export function useCreateMyConge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: MeCongeInput) => meService.createConge(input),
    meta: { successMessage: 'Demande de congé envoyée' },
    onSuccess: () => qc.invalidateQueries({ queryKey: [ME, 'conges'] }),
  });
}

export function useCancelMyConge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => meService.cancelConge(id),
    meta: { successMessage: 'Demande de congé annulée' },
    onSuccess: () => qc.invalidateQueries({ queryKey: [ME, 'conges'] }),
  });
}

export function useMyRapports() {
  return useQuery({ queryKey: [ME, 'rapports'], queryFn: meService.myRapports });
}

export function useUpsertMyRapport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: MeRapportInput) => meService.upsertRapport(input),
    meta: { successMessage: 'Rapport enregistré' },
    onSuccess: () => qc.invalidateQueries({ queryKey: [ME, 'rapports'] }),
  });
}

export function useDeleteMyRapport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => meService.deleteRapport(id),
    meta: { successMessage: 'Rapport supprimé' },
    onSuccess: () => qc.invalidateQueries({ queryKey: [ME, 'rapports'] }),
  });
}

export function useMyDocuments() {
  return useQuery({ queryKey: [ME, 'documents'], queryFn: meService.myDocuments });
}
