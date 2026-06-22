import { useQuery } from '@tanstack/react-query';
import { annuaireService } from './service';

export function useAnnuaire() {
  return useQuery({ queryKey: ['annuaire'], queryFn: annuaireService.list });
}
