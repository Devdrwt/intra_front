import { api } from '@/lib/api';
import { USE_MOCKS } from '@/lib/config';
import type {
  MailAccountStatus,
  MailListItem,
  MailMessage,
  SaveAccountInput,
  SendInput,
} from './types';

/** Webmail — endpoints /webmail (IMAP/SMTP self-service). */
const httpApi = {
  account: () => api.get<MailAccountStatus>('/webmail/account').then((r) => r.data),
  saveAccount: (input: SaveAccountInput) =>
    api.put<{ configured: true; email: string }>('/webmail/account', input).then((r) => r.data),
  removeAccount: () => api.delete('/webmail/account').then(() => undefined),
  inbox: () => api.get<MailListItem[]>('/webmail/inbox', { params: { limit: 30 } }).then((r) => r.data),
  message: (uid: number) => api.get<MailMessage>(`/webmail/messages/${uid}`).then((r) => r.data),
  downloadAttachment: (uid: number, index: number) =>
    api.get(`/webmail/messages/${uid}/attachments/${index}`, { responseType: 'blob' }).then((r) => r.data as Blob),
  send: (input: SendInput) => api.post('/webmail/send', input).then(() => undefined),
};

const delay = <T>(value: T, ms = 200): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));
const mockApi = {
  account: () => delay<MailAccountStatus>({ configured: false }),
  saveAccount: (input: SaveAccountInput) => delay({ configured: true as const, email: input.email }),
  removeAccount: () => delay(undefined),
  inbox: () => delay([] as MailListItem[]),
  message: (uid: number) =>
    delay<MailMessage>({ uid, from: null, to: null, subject: '(mock)', date: null, html: null, text: 'mock', attachments: [] }),
  downloadAttachment: (_uid: number, _index: number) => delay(new Blob(['mock'])),
  send: (_input: SendInput) => delay(undefined),
};

export const webmailService = USE_MOCKS.webmail ? mockApi : httpApi;
