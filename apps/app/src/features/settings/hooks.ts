import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsService } from './service';
import type { DepartmentInput, ServiceInput } from './types';

const DEPTS = ['settings', 'departments'];
const SERVICES = ['settings', 'services'];

export function useDepartments() {
  return useQuery({ queryKey: DEPTS, queryFn: settingsService.listDepartments });
}

/** Noms de départements (liste réelle ; vide tant qu'aucun n'est configuré). */
export function useDepartmentNames(): string[] {
  const { data } = useDepartments();
  return (data ?? []).map((d) => d.name);
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

/**
 * Noms de services, optionnellement filtrés sur un département (par son nom).
 * Inclut les services globaux (sans département).
 */
export function useServiceNames(departmentName?: string): string[] {
  const { data: services } = useServices();
  const { data: departments } = useDepartments();
  const deptId = departments?.find((d) => d.name === departmentName)?.id;
  return (services ?? [])
    .filter((s) => !departmentName || !s.departmentId || s.departmentId === deptId)
    .map((s) => s.name);
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
