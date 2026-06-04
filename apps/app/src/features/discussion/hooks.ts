import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { discussionService } from './service';
import type { MessageInput } from './types';

const KEY = 'discussion';

export function useMessages() {
  return useQuery({
    queryKey: [KEY],
    queryFn: discussionService.list,
    refetchInterval: 5000, // polling : nouveaux messages toutes les ~5 s
    refetchOnWindowFocus: true,
  });
}

export function usePostMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: MessageInput) => discussionService.post(input),
    meta: { silentError: true },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeleteMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => discussionService.remove(id),
    meta: { successMessage: 'Message supprimé' },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
