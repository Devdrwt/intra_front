import { api } from '@/lib/api';
import { USE_MOCKS } from '@/lib/config';
import type { AttachmentRef, Message, MessageInput } from './types';

/** Fil de discussion d'entreprise — endpoints /discussion (canal unique). */
const httpApi = {
  list: () => api.get<Message[]>('/discussion', { params: { limit: 50 } }).then((r) => r.data),
  post: (input: MessageInput) => api.post<Message>('/discussion', input).then((r) => r.data),
  remove: (id: string) => api.delete(`/discussion/${id}`).then(() => undefined),
  uploadAttachment: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post<AttachmentRef>('/discussion/attachment', fd).then((r) => r.data);
  },
  downloadAttachment: (id: string) =>
    api.get(`/discussion/${id}/attachment`, { responseType: 'blob' }).then((r) => r.data as Blob),
};

// --- MOCK (repli hors-ligne) --------------------------------------------------
const delay = <T>(value: T, ms = 150): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));
let store: Message[] = [];
let seq = 0;
const mockApi = {
  list: () => delay([...store]),
  post: (input: MessageInput) => {
    const m: Message = {
      id: `m${++seq}`,
      author: { id: 'me', name: 'Moi' },
      body: input.body,
      attachment: input.attachmentKey
        ? { name: input.attachmentName ?? 'fichier', size: input.attachmentSize ?? 0, type: input.attachmentType ?? '' }
        : undefined,
      createdAt: new Date().toISOString(),
    };
    store = [...store, m];
    return delay(m);
  },
  remove: (id: string) => {
    store = store.filter((m) => m.id !== id);
    return delay(undefined);
  },
  uploadAttachment: (file: File) =>
    delay({ key: `discussion/mock-${++seq}`, name: file.name, size: file.size, type: file.type }),
  downloadAttachment: (_id: string) => delay(new Blob(['mock'])),
};

export const discussionService = USE_MOCKS.discussion ? mockApi : httpApi;
