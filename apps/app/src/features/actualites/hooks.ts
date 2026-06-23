import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { actualitesService } from './service';
import type { Annonce, CreateAnnonceInput, ReactionType } from './types';

const KEY = 'annonces';

export function useAnnonces() {
  return useQuery({ queryKey: [KEY], queryFn: actualitesService.list });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => actualitesService.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useToggleReaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, type }: { id: string; type: ReactionType }) =>
      actualitesService.toggleReaction(id, type),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useAnnonceComments(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, 'comments', id],
    queryFn: () => actualitesService.comments(id!),
    enabled: !!id,
  });
}

export function useAddComment(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (contenu: string) => actualitesService.addComment(id, contenu),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, 'comments', id] });
      qc.invalidateQueries({ queryKey: [KEY] });
    },
  });
}

export function useRemoveComment(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => actualitesService.removeComment(commentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, 'comments', id] });
      qc.invalidateQueries({ queryKey: [KEY] });
    },
  });
}

export function useCreateAnnonce() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAnnonceInput) => actualitesService.create(input),
    meta: { successMessage: 'Actualité publiée' },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateAnnonce() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Annonce> }) =>
      actualitesService.update(id, patch),
    meta: { successMessage: 'Actualité mise à jour' },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useRemoveAnnonce() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => actualitesService.remove(id),
    meta: { successMessage: 'Actualité supprimée' },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
