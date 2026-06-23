import { api } from '@/lib/api';
import type { CreateCollectionInput, MediaCollection, MediaItem } from './types';

export const mediaService = {
  listCollections: () => api.get<MediaCollection[]>('/media/collections').then((r) => r.data),
  createCollection: (input: CreateCollectionInput) =>
    api.post<MediaCollection>('/media/collections', input).then((r) => r.data),
  removeCollection: (id: string) => api.delete(`/media/collections/${id}`).then(() => undefined),

  listItems: (collectionId: string) =>
    api.get<MediaItem[]>(`/media/collections/${collectionId}/items`).then((r) => r.data),
  addItem: (collectionId: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post<MediaItem>(`/media/collections/${collectionId}/items`, fd).then((r) => r.data);
  },
  removeItem: (id: string) => api.delete(`/media/items/${id}`).then(() => undefined),
  getAccess: (id: string) => api.get<string[]>(`/media/collections/${id}/access`).then((r) => r.data),
  setAccess: (id: string, userIds: string[]) =>
    api.put(`/media/collections/${id}/access`, { userIds }).then(() => undefined),
  setRestricted: (id: string, restricted: boolean) =>
    api.patch<MediaCollection>(`/media/collections/${id}/restricted`, { restricted }).then((r) => r.data),
};
