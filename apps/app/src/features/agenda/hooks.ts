import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { agendaService, type EvenementInput, type IcalFeedInput } from './service';

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

export function useIcalFeeds() {
  return useQuery({ queryKey: ['agenda', 'feeds'], queryFn: agendaService.listFeeds });
}

export function useAddIcalFeed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: IcalFeedInput) => agendaService.addFeed(input),
    meta: { successMessage: 'Calendrier externe ajouté' },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agenda'] }),
  });
}

export function useRemoveIcalFeed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => agendaService.removeFeed(id),
    meta: { successMessage: 'Calendrier externe retiré' },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agenda'] }),
  });
}
