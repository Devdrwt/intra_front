import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectsService } from './service';
import type { ProjectFilters, ProjectInput } from './types';

const KEY = 'projects';

export function useProjects(filters: ProjectFilters) {
  return useQuery({ queryKey: [KEY, 'list', filters], queryFn: () => projectsService.list(filters) });
}

export function useAssignablePeople() {
  return useQuery({ queryKey: [KEY, 'assignables'], queryFn: projectsService.assignables });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, 'detail', id],
    queryFn: () => projectsService.get(id!),
    enabled: Boolean(id),
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProjectInput) => projectsService.create(input),
    meta: { successMessage: 'Projet créé' },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateProject(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProjectInput) => projectsService.update(id, input),
    meta: { successMessage: 'Projet mis à jour' },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projectsService.remove(id),
    meta: { successMessage: 'Projet supprimé' },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUploadProjectDocument(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => projectsService.uploadDocument(id, file),
    meta: { successMessage: 'Fichier ajouté' },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY, 'detail', id] }),
  });
}

export function useRemoveProjectDocument(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (docId: string) => projectsService.removeDocument(id, docId),
    meta: { successMessage: 'Fichier supprimé' },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY, 'detail', id] }),
  });
}
