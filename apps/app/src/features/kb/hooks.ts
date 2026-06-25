import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { kbService, type KbInput } from './service';

const KEY = 'kb';

export function useKbArticles(q: string, categorie: string) {
  return useQuery({ queryKey: [KEY, q, categorie], queryFn: () => kbService.list(q, categorie) });
}

export function useCreateKb() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: KbInput) => kbService.create(input),
    meta: { successMessage: 'Article publié' },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateKb() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<KbInput> }) => kbService.update(id, input),
    meta: { successMessage: 'Article mis à jour' },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useRemoveKb() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => kbService.remove(id),
    meta: { successMessage: 'Article supprimé' },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
