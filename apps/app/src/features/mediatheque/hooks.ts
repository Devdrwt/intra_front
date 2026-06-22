import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mediaService } from './service';
import type { CreateCollectionInput } from './types';

const KEY = 'media';

export function useCollections() {
  return useQuery({ queryKey: [KEY, 'collections'], queryFn: mediaService.listCollections });
}

export function useCreateCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCollectionInput) => mediaService.createCollection(input),
    meta: { successMessage: 'Galerie créée' },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY, 'collections'] }),
  });
}

export function useRemoveCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mediaService.removeCollection(id),
    meta: { successMessage: 'Galerie supprimée' },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY, 'collections'] }),
  });
}

export function useItems(collectionId: string | null) {
  return useQuery({
    queryKey: [KEY, 'items', collectionId],
    queryFn: () => mediaService.listItems(collectionId!),
    enabled: !!collectionId,
  });
}

export function useAddItem(collectionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => mediaService.addItem(collectionId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, 'items', collectionId] });
      qc.invalidateQueries({ queryKey: [KEY, 'collections'] });
    },
  });
}

export function useRemoveItem(collectionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mediaService.removeItem(id),
    meta: { successMessage: 'Média supprimé' },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, 'items', collectionId] });
      qc.invalidateQueries({ queryKey: [KEY, 'collections'] });
    },
  });
}
