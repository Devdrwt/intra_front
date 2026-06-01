import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { documentsService } from './service';
import type { DocumentInput } from './types';

const KEY = 'documents';

export function useDocumentsEmploye(employeId: string | undefined) {
  return useQuery({
    queryKey: [KEY, 'employe', employeId],
    queryFn: () => documentsService.listByEmploye(employeId!),
    enabled: Boolean(employeId),
  });
}

export function useAddDocument(employeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: DocumentInput) => documentsService.create(employeId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY, 'employe', employeId] }),
  });
}

export function useRemoveDocument(employeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => documentsService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY, 'employe', employeId] }),
  });
}
