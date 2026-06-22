import { api } from '@/lib/api';
import type { Absent, AnnuaireEntry, TempsForts } from './types';

export const annuaireService = {
  list: () => api.get<AnnuaireEntry[]>('/annuaire').then((r) => r.data),
  tempsForts: () => api.get<TempsForts>('/annuaire/temps-forts').then((r) => r.data),
  absents: () => api.get<Absent[]>('/annuaire/absents').then((r) => r.data),
};
