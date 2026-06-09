import { useQuery } from '@tanstack/react-query';
import { searchService } from './service';

/**
 * Recherche globale live (debounce ~200ms via `enabled` + clé). Renvoie des groupes
 * (employés, tickets, documents…) déjà filtrés par permissions côté serveur.
 */
export function useGlobalSearch(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: ['search', q],
    queryFn: () => searchService.query(q),
    enabled: q.length >= 2,
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}
