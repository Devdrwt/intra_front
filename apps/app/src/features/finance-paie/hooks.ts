import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paieService } from './service';

export function usePeriodesPaie() {
  return useQuery({ queryKey: ['finance', 'paie', 'periodes'], queryFn: paieService.listPeriodes });
}
export function useBulletins(periodeId: string | undefined) {
  return useQuery({
    queryKey: ['finance', 'paie', 'bulletins', periodeId],
    queryFn: () => paieService.bulletins(periodeId as string),
    enabled: !!periodeId,
  });
}
export function useGenererPeriode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paieService.generer(id),
    meta: { successMessage: 'Bulletins générés' },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'paie'] }),
  });
}
export function useValiderPeriode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paieService.valider(id),
    meta: { successMessage: 'Période validée' },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'paie'] }),
  });
}
export function usePayerBulletin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, paiementRef }: { id: string; paiementRef: string }) => paieService.payer(id, paiementRef),
    meta: { successMessage: 'Salaire payé' },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'paie'] }),
  });
}
