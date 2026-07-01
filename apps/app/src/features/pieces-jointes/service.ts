import { api } from '@/lib/api';
import { triggerDownload } from '@/lib/download';
import type { PieceEntityType, PieceJointe } from './types';

export const piecesJointesService = {
  list: (entityType: PieceEntityType, entityId: string) =>
    api
      .get<PieceJointe[]>('/pieces-jointes', { params: { entityType, entityId } })
      .then((r) => r.data),

  upload: (input: { entityType: PieceEntityType; entityId: string; file: File; label?: string }) => {
    const fd = new FormData();
    fd.append('entityType', input.entityType);
    fd.append('entityId', input.entityId);
    if (input.label) fd.append('label', input.label);
    fd.append('file', input.file);
    return api.post<PieceJointe>('/pieces-jointes', fd).then((r) => r.data);
  },

  download: (id: string, name: string) =>
    api
      .get(`/pieces-jointes/${id}/file`, { responseType: 'blob' })
      .then((r) => triggerDownload(r.data, name)),

  remove: (id: string) => api.delete(`/pieces-jointes/${id}`).then(() => undefined),
};
