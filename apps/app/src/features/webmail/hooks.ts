import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { webmailService } from './service';
import type { SaveAccountInput, SendInput } from './types';

const KEY = 'webmail';

export function useMailAccount() {
  return useQuery({ queryKey: [KEY, 'account'], queryFn: webmailService.account });
}

export function useSaveMailAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveAccountInput) => webmailService.saveAccount(input),
    meta: { successMessage: 'Messagerie connectée', silentError: true },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useRemoveMailAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => webmailService.removeAccount(),
    meta: { successMessage: 'Messagerie déconnectée' },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useInbox(enabled: boolean) {
  return useQuery({
    queryKey: [KEY, 'inbox'],
    queryFn: webmailService.inbox,
    enabled,
    refetchInterval: 60_000,
  });
}

export function useMailMessage(uid: number | null) {
  return useQuery({
    queryKey: [KEY, 'message', uid],
    queryFn: () => webmailService.message(uid!),
    enabled: uid != null,
  });
}

export function useSendMail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SendInput) => webmailService.send(input),
    meta: { successMessage: 'Message envoyé', silentError: true },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY, 'inbox'] }),
  });
}
