import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { documentationService } from './service';
import type { CreateDocInput } from './types';

const KEY = 'docs';

export function useDocs(categorie: string, q: string) {
  return useQuery({
    queryKey: [KEY, categorie, q],
    queryFn: () => documentationService.list(categorie, q),
  });
}

export function useCreateDoc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDocInput) => documentationService.create(input),
    meta: { successMessage: 'Document déposé' },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useRemoveDoc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => documentationService.remove(id),
    meta: { successMessage: 'Document supprimé' },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDocVersions(docId: string | null) {
  return useQuery({
    queryKey: [KEY, 'versions', docId],
    queryFn: () => documentationService.listVersions(docId!),
    enabled: !!docId,
  });
}

export function useAddVersion(docId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, note }: { file: File; note?: string }) =>
      documentationService.addVersion(docId, file, note),
    meta: { successMessage: 'Nouvelle version déposée' },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: [KEY, 'versions', docId] });
    },
  });
}
