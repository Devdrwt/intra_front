import { useQuery } from '@tanstack/react-query';
import { annuaireService } from './service';

export function useAnnuaire() {
  return useQuery({ queryKey: ['annuaire'], queryFn: annuaireService.list });
}

export function useTempsForts() {
  return useQuery({ queryKey: ['annuaire', 'temps-forts'], queryFn: annuaireService.tempsForts });
}

export function useAbsents() {
  return useQuery({ queryKey: ['annuaire', 'absents'], queryFn: annuaireService.absents });
}
