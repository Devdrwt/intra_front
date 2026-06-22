import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { tasksService, type TaskInput, type TaskStatus } from './service';

const FULL_KEY = ['tasks', 'mine', 'full'];

function invalidate(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: ['tasks'] });
}

export function useMyTasksFull() {
  return useQuery({ queryKey: FULL_KEY, queryFn: tasksService.list });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TaskInput) => tasksService.createFull(input),
    meta: { successMessage: 'Tâche créée' },
    onSuccess: () => invalidate(qc),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TaskInput }) => tasksService.update(id, input),
    onSuccess: () => invalidate(qc),
  });
}

export function useMoveTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, statut }: { id: string; statut: TaskStatus }) => tasksService.move(id, statut),
    onSuccess: () => invalidate(qc),
  });
}

export function useRemoveTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksService.remove(id),
    meta: { successMessage: 'Tâche supprimée' },
    onSuccess: () => invalidate(qc),
  });
}

export function useSubtasks(parentId: string) {
  return useQuery({ queryKey: ['tasks', 'subtasks', parentId], queryFn: () => tasksService.subtasks(parentId) });
}

export function useCreateSubtask(parentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (titre: string) => tasksService.createFull({ titre, parentTaskId: parentId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', 'subtasks', parentId] }),
  });
}

export function useTaskComments(taskId: string) {
  return useQuery({ queryKey: ['tasks', 'comments', taskId], queryFn: () => tasksService.comments(taskId) });
}

export function useAddComment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => tasksService.addComment(taskId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', 'comments', taskId] }),
  });
}

export function useRemoveComment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksService.removeComment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', 'comments', taskId] }),
  });
}
