import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { presencesService } from './service';
import type { DemandeCongeInput, StatutConge } from './types';

const POINTAGES = 'pointages';
const CONGES = 'conges';

export function usePointagesDuJour() {
  return useQuery({ queryKey: [POINTAGES, 'jour'], queryFn: presencesService.pointagesDuJour });
}

export function usePointer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeId, sens }: { employeId: string; sens: 'ENTREE' | 'SORTIE' }) =>
      presencesService.pointer(employeId, sens),
    meta: { successMessage: 'Pointage enregistré' },
    onSuccess: () => qc.invalidateQueries({ queryKey: [POINTAGES] }),
  });
}

export function useConges() {
  return useQuery({ queryKey: [CONGES], queryFn: presencesService.listConges });
}

export function useCreateConge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: DemandeCongeInput) => presencesService.createConge(input),
    meta: { successMessage: 'Demande de congé envoyée' },
    onSuccess: () => qc.invalidateQueries({ queryKey: [CONGES] }),
  });
}

export function useSetStatutConge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, statut }: { id: string; statut: StatutConge }) =>
      presencesService.setStatutConge(id, statut),
    meta: { successMessage: 'Demande mise à jour' },
    onSuccess: () => qc.invalidateQueries({ queryKey: [CONGES] }),
  });
}
