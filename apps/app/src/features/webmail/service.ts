import { api } from '@/lib/api';
import { USE_MOCKS } from '@/lib/config';
import type {
  MailAccount,
  MailListItem,
  MailMessage,
  SaveAccountInput,
  SendInput,
} from './types';

/** Webmail multi-comptes — endpoints /webmail/accounts (IMAP/SMTP self-service). */
const httpApi = {
  accounts: () => api.get<MailAccount[]>('/webmail/accounts').then((r) => r.data),
  addAccount: (input: SaveAccountInput) =>
    api.post<{ id: string; label: string; email: string }>('/webmail/accounts', input).then((r) => r.data),
  removeAccount: (id: string) => api.delete(`/webmail/accounts/${id}`).then(() => undefined),
  inbox: (accountId: string) =>
    api.get<MailListItem[]>(`/webmail/accounts/${accountId}/inbox`, { params: { limit: 30 } }).then((r) => r.data),
  message: (accountId: string, uid: number) =>
    api.get<MailMessage>(`/webmail/accounts/${accountId}/messages/${uid}`).then((r) => r.data),
  downloadAttachment: (accountId: string, uid: number, index: number) =>
    api
      .get(`/webmail/accounts/${accountId}/messages/${uid}/attachments/${index}`, { responseType: 'blob' })
      .then((r) => r.data as Blob),
  send: (accountId: string, input: SendInput) =>
    api.post(`/webmail/accounts/${accountId}/send`, input).then(() => undefined),
};

const delay = <T>(value: T, ms = 200): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));
const mockApi = {
  accounts: () => delay<MailAccount[]>([]),
  addAccount: (input: SaveAccountInput) =>
    delay({ id: 'mock', label: input.label ?? input.email, email: input.email }),
  removeAccount: (_id: string) => delay(undefined),
  inbox: (_accountId: string) => delay([] as MailListItem[]),
  message: (_accountId: string, uid: number) =>
    delay<MailMessage>({ uid, from: null, to: null, subject: '(mock)', date: null, html: null, text: 'mock', attachments: [] }),
  downloadAttachment: (_accountId: string, _uid: number, _index: number) => delay(new Blob(['mock'])),
  send: (_accountId: string, _input: SendInput) => delay(undefined),
};

export const webmailService = USE_MOCKS.webmail ? mockApi : httpApi;
