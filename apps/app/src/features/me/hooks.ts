import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  meService,
  type MeCongeInput,
  type MeRapportInput,
  type PasswordChange,
  type ProfileUpdate,
} from './service';
import { enqueuePointage, isNetworkError, startPointageAutoSync } from '@/lib/offlineQueue';
import { getCoords } from '@/lib/geo';
import { toast } from '@/lib/toast';
import type { Pointage, PointageSens } from '@/features/presences/types';

const ME = 'me';

export function useMyProfile() {
  return useQuery({ queryKey: [ME, 'profile'], queryFn: meService.getProfile });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProfileUpdate) => meService.updateProfile(input),
    meta: { successMessage: 'Profil mis à jour' },
    onSuccess: () => qc.invalidateQueries({ queryKey: [ME, 'profile'] }),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: PasswordChange) => meService.changePassword(input),
    meta: { successMessage: 'Mot de passe modifié' },
  });
}

export function useUploadAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => meService.uploadAvatar(file),
    meta: { successMessage: 'Photo de profil mise à jour' },
    onSuccess: () => qc.invalidateQueries({ queryKey: [ME, 'profile'] }),
  });
}

export function useRemoveAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => meService.removeAvatar(),
    meta: { successMessage: 'Photo de profil retirée' },
    onSuccess: () => qc.invalidateQueries({ queryKey: [ME, 'profile'] }),
  });
}

export function useMyProjects() {
  return useQuery({ queryKey: [ME, 'projects'], queryFn: meService.myProjects });
}

export function useMyEmploye() {
  return useQuery({
    queryKey: [ME, 'employe'],
    queryFn: meService.myEmploye,
    retry: false, // 404 = compte non rattaché à une fiche → on affiche un message dédié
  });
}

export function useMyPointages() {
  return useQuery({ queryKey: [ME, 'pointages'], queryFn: meService.myPointages });
}

export function useMePointer() {
  const qc = useQueryClient();
  return useMutation<Pointage | { offline: true }, Error, PointageSens>({
    // Offline-aware : si pas de réseau, on met en file (rejouée à la reconnexion).
    mutationFn: async (sens) => {
      const coords = await getCoords(); // best-effort (géofence / géoloc obligatoire)
      try {
        return await meService.pointer(sens, coords);
      } catch (err) {
        if (isNetworkError(err)) {
          enqueuePointage(sens, coords);
          return { offline: true };
        }
        throw err;
      }
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: [ME, 'pointages'] });
      startPointageAutoSync(meService.pointer); // vide la file dès qu'on est en ligne
      if (res && 'offline' in res) {
        toast.success('Pointage enregistré hors-ligne — synchronisé à la reconnexion.');
      } else {
        toast.success('Pointage enregistré');
      }
    },
  });
}

export function useMyConges() {
  return useQuery({ queryKey: [ME, 'conges'], queryFn: meService.myConges });
}

export function useCreateMyConge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: MeCongeInput) => meService.createConge(input),
    meta: { successMessage: 'Demande de congé envoyée' },
    onSuccess: () => qc.invalidateQueries({ queryKey: [ME, 'conges'] }),
  });
}

export function useCancelMyConge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => meService.cancelConge(id),
    meta: { successMessage: 'Demande de congé annulée' },
    onSuccess: () => qc.invalidateQueries({ queryKey: [ME, 'conges'] }),
  });
}

export function useMyRapports() {
  return useQuery({ queryKey: [ME, 'rapports'], queryFn: meService.myRapports });
}

export function useUpsertMyRapport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: MeRapportInput) => meService.upsertRapport(input),
    meta: { successMessage: 'Rapport enregistré' },
    onSuccess: () => qc.invalidateQueries({ queryKey: [ME, 'rapports'] }),
  });
}

export function useDeleteMyRapport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => meService.deleteRapport(id),
    meta: { successMessage: 'Rapport supprimé' },
    onSuccess: () => qc.invalidateQueries({ queryKey: [ME, 'rapports'] }),
  });
}

export function useMyDocuments() {
  return useQuery({ queryKey: [ME, 'documents'], queryFn: meService.myDocuments });
}
