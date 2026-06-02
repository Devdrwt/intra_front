import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsService } from './service';
import type { DepartmentInput, ServiceInput } from './types';

const DEPTS = ['settings', 'departments'];
const SERVICES = ['settings', 'services'];

export function useDepartments() {
  return useQuery({ queryKey: DEPTS, queryFn: settingsService.listDepartments });
}

/** Noms de départements (avec repli sur une liste minimale si vide/chargement). */
export function useDepartmentNames(): string[] {
  const { data } = useDepartments();
  const names = (data ?? []).map((d) => d.name);
  return names.length ? names : ['Administration', 'Production', 'Commercial', 'Direction'];
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: DepartmentInput) => settingsService.createDepartment(input),
    meta: { successMessage: 'Département ajouté' },
    onSuccess: () => qc.invalidateQueries({ queryKey: DEPTS }),
  });
}

export function useDeleteDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => settingsService.deleteDepartment(id),
    meta: { successMessage: 'Département supprimé' },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });
}

export function useServices() {
  return useQuery({ queryKey: SERVICES, queryFn: settingsService.listServices });
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ServiceInput) => settingsService.createService(input),
    meta: { successMessage: 'Service ajouté' },
    onSuccess: () => qc.invalidateQueries({ queryKey: SERVICES }),
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => settingsService.deleteService(id),
    meta: { successMessage: 'Service supprimé' },
    onSuccess: () => qc.invalidateQueries({ queryKey: SERVICES }),
  });
}
