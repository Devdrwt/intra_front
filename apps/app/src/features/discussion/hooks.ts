import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { discussionService } from './service';
import type { MessageInput } from './types';

const KEY = 'discussion';

export function useConversations() {
  return useQuery({
    queryKey: [KEY, 'convs'],
    queryFn: discussionService.conversations,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });
}

/** Total des messages non lus (badge du menu). Sondé régulièrement. */
export function useUnreadCount() {
  return useQuery({
    queryKey: [KEY, 'unread'],
    queryFn: discussionService.unreadCount,
    refetchInterval: 20000,
    refetchOnWindowFocus: true,
  });
}

export function useContacts() {
  return useQuery({ queryKey: [KEY, 'contacts'], queryFn: discussionService.contacts });
}

export function useMessages(convId: string | undefined) {
  return useQuery({
    queryKey: [KEY, 'msgs', convId],
    queryFn: () => discussionService.messages(convId!),
    enabled: Boolean(convId),
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });
}

export function usePostMessage(convId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: MessageInput) => discussionService.post(convId, input),
    meta: { silentError: true },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, 'msgs', convId] });
      qc.invalidateQueries({ queryKey: [KEY, 'convs'] });
      qc.invalidateQueries({ queryKey: [KEY, 'unread'] });
    },
  });
}

export function useDeleteMessage(convId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (msgId: string) => discussionService.remove(convId, msgId),
    meta: { successMessage: 'Message supprimé' },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY, 'msgs', convId] }),
  });
}

export function useCreateDirect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => discussionService.createDirect(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY, 'convs'] }),
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, userIds }: { name: string; userIds: string[] }) =>
      discussionService.createGroup(name, userIds),
    meta: { successMessage: 'Groupe créé' },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY, 'convs'] }),
  });
}
