import { api } from '@/lib/api';
import type { AnnuaireEntry } from './types';

export const annuaireService = {
  list: () => api.get<AnnuaireEntry[]>('/annuaire').then((r) => r.data),
};
