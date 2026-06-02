import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { espacesService } from './service';

const KEY = 'espaces';

export function useEspaceMoi() {
  return useQuery({ queryKey: [KEY, 'moi'], queryFn: espacesService.espaceMoi });
}

export function useNotifications(unreadOnly = false) {
  return useQuery({
    queryKey: [KEY, 'notifications', unreadOnly],
    queryFn: () => espacesService.list(unreadOnly),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: [KEY, 'unread-count'],
    queryFn: espacesService.unreadCount,
    // Sondage léger pour la cloche (rafraîchit le badge).
    refetchInterval: 30_000,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => espacesService.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => espacesService.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
