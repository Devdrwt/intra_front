import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { employesService } from './service';
import type { EmployeFilters, EmployeInput } from './types';

const KEY = 'employes';

export function useEmployes(filters: EmployeFilters) {
  return useQuery({
    queryKey: [KEY, filters],
    queryFn: () => employesService.list(filters),
  });
}

/** Index employeId → employé, pour résoudre les libellés depuis d'autres modules. */
export function useEmployeLookup() {
  const query = useEmployes({});
  const byId = new Map((query.data ?? []).map((e) => [e.id, e]));
  return { ...query, byId };
}

export function useEmploye(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, 'detail', id],
    queryFn: () => employesService.get(id!),
    enabled: Boolean(id),
  });
}

export function useCreateEmploye() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: EmployeInput) => employesService.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateEmploye(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: EmployeInput) => employesService.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeleteEmploye() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => employesService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
