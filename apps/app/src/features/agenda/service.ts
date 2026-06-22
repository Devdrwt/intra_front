import { api } from '@/lib/api';
import { USE_MOCKS } from '@/lib/config';

/**
 * Agenda du collaborateur (cf. docs/contracts/agenda.md). VITE_MOCK_AGENDA=false → réel.
 *   GET /agenda?from&to · POST/PATCH/DELETE /agenda/evenements · GET /me/agenda/ical-url
 * Items = événements perso (éditables) + projection des modules (lecture seule).
 */
export type AgendaSource = 'PERSO' | 'CONGE' | 'FORMATION' | 'STUDIO' | 'TACHE' | 'AO' | 'PAIE';
export type TypeEvenement = 'RENDEZ_VOUS' | 'REUNION' | 'RAPPEL' | 'CRENEAU' | 'AUTRE';
export type Recurrence = 'AUCUNE' | 'QUOTIDIEN' | 'HEBDO' | 'MENSUEL';

export const TYPE_EVT_OPTIONS: { value: TypeEvenement; label: string }[] = [
  { value: 'RENDEZ_VOUS', label: 'Rendez-vous' },
  { value: 'REUNION', label: 'Réunion' },
  { value: 'RAPPEL', label: 'Rappel' },
  { value: 'CRENEAU', label: 'Créneau' },
  { value: 'AUTRE', label: 'Autre' },
];
export const RECURRENCE_OPTIONS: { value: Recurrence; label: string }[] = [
  { value: 'AUCUNE', label: 'Ne se répète pas' },
  { value: 'QUOTIDIEN', label: 'Tous les jours' },
  { value: 'HEBDO', label: 'Toutes les semaines' },
  { value: 'MENSUEL', label: 'Tous les mois' },
];
export const RAPPEL_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: 'Aucun rappel' },
  { value: 10, label: '10 min avant' },
  { value: 30, label: '30 min avant' },
  { value: 60, label: '1 h avant' },
  { value: 1440, label: '1 jour avant' },
];

export interface AgendaItem {
  id: string;
  source: AgendaSource;
  titre: string;
  debut: string; // ISO
  fin: string; // ISO
  journeeEntiere: boolean;
  lieu?: string;
  url?: string;
  editable: boolean;
  type?: TypeEvenement;
  recurrent?: boolean;
}

/** Couleur d'un événement perso selon sa catégorie (sinon couleur de la source). */
export const TYPE_COLOR: Record<TypeEvenement, string> = {
  RENDEZ_VOUS: '#4F46E5',
  REUNION: '#0891B2',
  RAPPEL: '#D97706',
  CRENEAU: '#7C3AED',
  AUTRE: '#64748B',
};

export interface EvenementInput {
  titre: string;
  debut: string;
  fin: string;
  journeeEntiere?: boolean;
  lieu?: string;
  type?: TypeEvenement;
  recurrence?: Recurrence;
  rappelMinutes?: number;
}

const delay = <T>(value: T, ms = 140): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

// --- MOCK ---------------------------------------------------------------------
const day = (offset: number, h = 9, m = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};
const allDay = (offset: number): { debut: string; fin: string } => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(0, 0, 0, 0);
  const f = new Date(d);
  f.setHours(23, 59, 0, 0);
  return { debut: d.toISOString(), fin: f.toISOString() };
};

let seq = 1;
let perso: AgendaItem[] = [
  { id: 'ev1', source: 'PERSO', titre: 'Point équipe', debut: day(0, 10), fin: day(0, 11), journeeEntiere: false, editable: true },
  { id: 'ev2', source: 'PERSO', titre: 'Rendez-vous client SOBEBRA', debut: day(2, 14), fin: day(2, 15, 30), journeeEntiere: false, lieu: 'Cotonou', editable: true },
];
// Items agrégés (lecture seule) — simulent la projection des modules.
const aggregated: AgendaItem[] = [
  { id: 'ag-conge', source: 'CONGE', titre: 'Congé — A. Koffi', ...allDay(5), journeeEntiere: true, url: '/mes-demandes', editable: false },
  { id: 'ag-form', source: 'FORMATION', titre: 'Formation Excel avancé', debut: day(3, 9), fin: day(3, 17), journeeEntiere: false, url: '/formation', editable: false },
  { id: 'ag-studio', source: 'STUDIO', titre: 'Studio : tournage podcast', debut: day(1, 9), fin: day(1, 12), journeeEntiere: false, url: '/studio', editable: false },
  { id: 'ag-tache', source: 'TACHE', titre: 'Échéance : rapport mensuel', ...allDay(2), journeeEntiere: true, url: '/mes-taches', editable: false },
  { id: 'ag-ao', source: 'AO', titre: "Date limite AO — Mairie", ...allDay(8), journeeEntiere: true, url: '/appels-offres', editable: false },
  { id: 'ag-paie', source: 'PAIE', titre: 'Paie du mois', ...allDay(-2), journeeEntiere: true, url: '/finance/paie', editable: false },
];

const mockApi = {
  list: (_from?: string, _to?: string) => delay([...perso, ...aggregated]),
  create: (input: EvenementInput) => {
    seq += 1;
    const ev: AgendaItem = {
      id: `ev${seq + 10}`,
      source: 'PERSO',
      titre: input.titre,
      debut: input.debut,
      fin: input.fin,
      journeeEntiere: input.journeeEntiere ?? false,
      lieu: input.lieu,
      editable: true,
    };
    perso = [...perso, ev];
    return delay(ev);
  },
  remove: (id: string) => {
    perso = perso.filter((e) => e.id !== id);
    return delay(undefined);
  },
  icalUrl: () => delay({ url: `${location.origin}/api/v1/agenda/ical?token=demo-token-1234` }),
};

// --- HTTP ---------------------------------------------------------------------
const httpApi = {
  list: (from?: string, to?: string) =>
    api.get<AgendaItem[]>('/agenda', { params: { from, to } }).then((r) => r.data),
  create: (input: EvenementInput) =>
    api.post<AgendaItem>('/agenda/evenements', input).then((r) => r.data),
  remove: (id: string) => api.delete(`/agenda/evenements/${id}`).then(() => undefined),
  icalUrl: () => api.get<{ url: string }>('/me/agenda/ical-url').then((r) => r.data),
};

export const agendaService = USE_MOCKS.agenda ? mockApi : httpApi;
