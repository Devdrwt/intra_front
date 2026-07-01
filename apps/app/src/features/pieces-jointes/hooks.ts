import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { piecesJointesService } from './service';
import type { PieceEntityType } from './types';

const KEY = 'pieces-jointes';

export function usePiecesJointes(entityType: PieceEntityType, entityId: string, enabled = true) {
  return useQuery({
    queryKey: [KEY, entityType, entityId],
    queryFn: () => piecesJointesService.list(entityType, entityId),
    enabled: enabled && !!entityId,
  });
}

export function useUploadPiece(entityType: PieceEntityType, entityId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { file: File; label?: string }) =>
      piecesJointesService.upload({ entityType, entityId, ...input }),
    meta: { successMessage: 'Pièce jointe ajoutée' },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY, entityType, entityId] }),
  });
}

export function useRemovePiece(entityType: PieceEntityType, entityId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => piecesJointesService.remove(id),
    meta: { successMessage: 'Pièce jointe supprimée' },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY, entityType, entityId] }),
  });
}
