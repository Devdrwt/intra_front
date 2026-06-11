import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersService } from './service';
import type { InviteUserInput, UpdateUserInput } from './types';

const KEY = 'users';

export function useUsers() {
  return useQuery({ queryKey: [KEY], queryFn: usersService.list });
}

export function useInviteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: InviteUserInput) => usersService.invite(input),
    // L'erreur est affichée dans le panneau d'invitation (pas de double toast).
    meta: { silentError: true },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) =>
      usersService.update(id, input),
    meta: { successMessage: 'Utilisateur mis à jour' },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useSetUserAccess() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, permissions }: { id: string; permissions: string[] }) =>
      usersService.setAccess(id, permissions),
    meta: { successMessage: 'Accès aux modules mis à jour' },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersService.remove(id),
    meta: { successMessage: 'Compte supprimé' },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
