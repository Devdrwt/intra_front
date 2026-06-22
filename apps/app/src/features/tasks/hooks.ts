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
