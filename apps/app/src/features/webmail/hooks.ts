import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { webmailService } from './service';
import type { SaveAccountInput, SendInput } from './types';

const KEY = 'webmail';

export function useMailAccounts() {
  return useQuery({ queryKey: [KEY, 'accounts'], queryFn: webmailService.accounts });
}

export function useAddMailAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveAccountInput) => webmailService.addAccount(input),
    meta: { successMessage: 'Boîte mail connectée', silentError: true },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useRemoveMailAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => webmailService.removeAccount(id),
    meta: { successMessage: 'Boîte mail déconnectée' },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useInbox(accountId: string | null) {
  return useQuery({
    queryKey: [KEY, 'inbox', accountId],
    queryFn: () => webmailService.inbox(accountId!),
    enabled: accountId != null,
    refetchInterval: 60_000,
  });
}

export function useMailMessage(accountId: string | null, uid: number | null) {
  return useQuery({
    queryKey: [KEY, 'message', accountId, uid],
    queryFn: () => webmailService.message(accountId!, uid!),
    enabled: accountId != null && uid != null,
  });
}

export function useSendMail(accountId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SendInput) => webmailService.send(accountId!, input),
    meta: { successMessage: 'Message envoyé', silentError: true },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY, 'inbox', accountId] }),
  });
}
