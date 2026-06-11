import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { presencesService } from './service';
import type { DemandeCongeInput, MissionInput, PointageSens, StatutConge } from './types';

const POINTAGES = 'pointages';
const CONGES = 'conges';
const MISSIONS = 'missions';

export function useMissions() {
  return useQuery({ queryKey: [MISSIONS], queryFn: presencesService.listMissions });
}

export function useCreateMission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: MissionInput) => presencesService.createMission(input),
    meta: { successMessage: 'Mission enregistrée' },
    onSuccess: () => qc.invalidateQueries({ queryKey: [MISSIONS] }),
  });
}

export function useRemoveMission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => presencesService.removeMission(id),
    meta: { successMessage: 'Mission supprimée' },
    onSuccess: () => qc.invalidateQueries({ queryKey: [MISSIONS] }),
  });
}

export function usePointagesDuJour() {
  return useQuery({ queryKey: [POINTAGES, 'jour'], queryFn: presencesService.pointagesDuJour });
}

export function usePointer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeId, sens }: { employeId: string; sens: PointageSens }) =>
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

export function useCancelConge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => presencesService.cancelConge(id),
    meta: { successMessage: 'Demande annulée' },
    onSuccess: () => qc.invalidateQueries({ queryKey: [CONGES] }),
  });
}
