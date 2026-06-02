import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { rapportsService } from './service';
import type { ConsolidationQuery, RapportFilters, RapportInput } from './types';

const KEY = 'rapports';

export function useRapports(filters: RapportFilters) {
  return useQuery({
    queryKey: [KEY, 'list', filters],
    queryFn: () => rapportsService.list(filters),
  });
}

export function useRapport(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, 'detail', id],
    queryFn: () => rapportsService.get(id!),
    enabled: Boolean(id),
  });
}

export function useUpsertRapport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RapportInput) => rapportsService.upsert(input),
    meta: { successMessage: 'Rapport enregistré' },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useConsolidation(query: ConsolidationQuery, enabled = true) {
  return useQuery({
    queryKey: [KEY, 'consolidation', query],
    queryFn: () => rapportsService.consolidation(query),
    enabled,
  });
}

export function useCheckMissing() {
  return useMutation({
    mutationFn: (date?: string) => rapportsService.checkMissing(date),
  });
}
