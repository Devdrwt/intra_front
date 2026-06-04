import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { auditService } from './service';
import type { AuditFilters } from './types';

export function useAuditLogs(filters: AuditFilters) {
  return useQuery({
    queryKey: ['audit', filters],
    queryFn: () => auditService.list(filters),
    placeholderData: keepPreviousData, // garde la page courante pendant le chargement de la suivante
  });
}
