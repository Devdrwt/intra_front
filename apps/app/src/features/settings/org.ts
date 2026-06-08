import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

/** Détails d'organisation renvoyés par GET /settings (admin). */
export interface OrgSettings {
  name: string;
  timezone: string;
  currency: string;
  logoUrl?: string;
  hasLogo: boolean;
  allowedEmailDomains: string[];
}

/** Toujours en réel (le logo n'est pas concerné par le mock des référentiels). */
const orgService = {
  get: () => api.get<OrgSettings>('/settings').then((r) => r.data),
  uploadLogo: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/settings/logo', fd).then(() => undefined);
  },
  removeLogo: () => api.delete('/settings/logo').then(() => undefined),
};

const KEY = ['settings', 'org'];

export function useOrgSettings(enabled = true) {
  return useQuery({ queryKey: KEY, queryFn: orgService.get, enabled });
}

export function useUploadLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => orgService.uploadLogo(file),
    meta: { successMessage: 'Logo mis à jour' },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useRemoveLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => orgService.removeLogo(),
    meta: { successMessage: 'Logo retiré' },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
