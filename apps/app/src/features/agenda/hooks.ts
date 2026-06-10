import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { agendaService, type EvenementInput } from './service';

export function useAgenda(from?: string, to?: string) {
  return useQuery({
    queryKey: ['agenda', from ?? 'all', to ?? 'all'],
    queryFn: () => agendaService.list(from, to),
  });
}

export function useCreateEvenement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: EvenementInput) => agendaService.create(input),
    meta: { successMessage: 'Événement ajouté' },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agenda'] }),
  });
}

export function useDeleteEvenement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => agendaService.remove(id),
    meta: { successMessage: 'Événement supprimé' },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agenda'] }),
  });
}
