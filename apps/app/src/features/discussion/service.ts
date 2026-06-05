import { api } from '@/lib/api';
import { USE_MOCKS } from '@/lib/config';
import type {
  AttachmentRef,
  ConversationSummary,
  Contact,
  Message,
  MessageInput,
} from './types';

/** Messagerie d'entreprise — endpoints /conversations. */
const httpApi = {
  conversations: () => api.get<ConversationSummary[]>('/conversations').then((r) => r.data),
  contacts: () => api.get<Contact[]>('/conversations/contacts').then((r) => r.data),
  createDirect: (userId: string) =>
    api.post<ConversationSummary>('/conversations/direct', { userId }).then((r) => r.data),
  createGroup: (name: string, userIds: string[]) =>
    api.post<ConversationSummary>('/conversations/group', { name, userIds }).then((r) => r.data),
  messages: (convId: string) =>
    api.get<Message[]>(`/conversations/${convId}/messages`, { params: { limit: 50 } }).then((r) => r.data),
  post: (convId: string, input: MessageInput) =>
    api.post<Message>(`/conversations/${convId}/messages`, input).then((r) => r.data),
  remove: (convId: string, msgId: string) =>
    api.delete(`/conversations/${convId}/messages/${msgId}`).then(() => undefined),
  uploadAttachment: (convId: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post<AttachmentRef>(`/conversations/${convId}/attachment`, fd).then((r) => r.data);
  },
  downloadAttachment: (convId: string, msgId: string) =>
    api
      .get(`/conversations/${convId}/messages/${msgId}/attachment`, { responseType: 'blob' })
      .then((r) => r.data as Blob),
};

// --- MOCK (repli hors-ligne) --------------------------------------------------
const delay = <T>(value: T, ms = 150): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));
const company: ConversationSummary = {
  id: 'company',
  type: 'COMPANY',
  title: "Toute l'entreprise",
  avatar: null,
  lastMessage: null,
  updatedAt: new Date().toISOString(),
  participantsCount: 0,
};
const msgStore: Record<string, Message[]> = { company: [] };
let seq = 0;
const mockApi = {
  conversations: () => delay([company]),
  contacts: () => delay([] as Contact[]),
  createDirect: (_userId: string) => delay(company),
  createGroup: (_name: string, _userIds: string[]) => delay(company),
  messages: (convId: string) => delay([...(msgStore[convId] ?? [])]),
  post: (convId: string, input: MessageInput) => {
    const m: Message = { id: `m${++seq}`, author: { id: 'me', name: 'Moi', hasAvatar: false }, body: input.body, createdAt: new Date().toISOString() };
    msgStore[convId] = [...(msgStore[convId] ?? []), m];
    return delay(m);
  },
  remove: (convId: string, msgId: string) => {
    msgStore[convId] = (msgStore[convId] ?? []).filter((m) => m.id !== msgId);
    return delay(undefined);
  },
  uploadAttachment: (_convId: string, file: File) =>
    delay({ key: `discussion/mock-${++seq}`, name: file.name, size: file.size, type: file.type }),
  downloadAttachment: (_convId: string, _msgId: string) => delay(new Blob(['mock'])),
};

export const discussionService = USE_MOCKS.discussion ? mockApi : httpApi;
