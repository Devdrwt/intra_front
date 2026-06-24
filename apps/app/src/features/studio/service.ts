import { api } from '@/lib/api';
import { USE_MOCKS } from '@/lib/config';

/**
 * Studio — production média (cf. docs/contracts/studio.md). VITE_MOCK_STUDIO=false → réel.
 *   /productions · /reservations-studio
 */
export type TypeProduction = 'PODCAST' | 'VIDEO' | 'ENREGISTREMENT' | 'LIVE' | 'AUTRE';
export type StatutProduction = 'IDEE' | 'PLANIFIE' | 'TOURNAGE' | 'MONTAGE' | 'PUBLIE' | 'ANNULE';

export interface Production {
  id: string;
  reference: string;
  titre: string;
  type: TypeProduction;
  statut: StatutProduction;
  datePublicationPrevue?: string;
  livrableUrl?: string;
}
export interface Reservation {
  id: string;
  date: string;
  heureDebut: string;
  heureFin: string;
  objet?: string;
  productionTitre?: string;
}
export interface Equipement {
  id: string;
  nom: string;
  categorie?: string;
  disponible: boolean;
}

const delay = <T>(value: T, ms = 150): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

// --- MOCK ---------------------------------------------------------------------
let seq = 2;
let productions: Production[] = [
  { id: 'p1', reference: 'PROD-2026-0001', titre: 'Podcast « Tech au Bénin » — Ép. 4', type: 'PODCAST', statut: 'MONTAGE', datePublicationPrevue: '2026-06-20' },
  { id: 'p2', reference: 'PROD-2026-0002', titre: 'Vidéo institutionnelle Drwintech', type: 'VIDEO', statut: 'TOURNAGE' },
  { id: 'p3', reference: 'PROD-2026-0003', titre: 'Capture conférence partenaires', type: 'ENREGISTREMENT', statut: 'PUBLIE', livrableUrl: 'https://...' },
];
let reservations: Reservation[] = [
  { id: 'r1', date: '2026-06-12', heureDebut: '09:00', heureFin: '12:00', objet: 'Tournage Ép. 4', productionTitre: 'Podcast « Tech au Bénin »' },
  { id: 'r2', date: '2026-06-14', heureDebut: '14:00', heureFin: '16:00', objet: 'Montage' },
];

const mockApi = {
  productions: () => delay([...productions]),
  createProduction: (titre: string, type: TypeProduction) => {
    seq += 1;
    const p: Production = { id: `p${seq}`, reference: `PROD-2026-${String(seq).padStart(4, '0')}`, titre, type, statut: 'IDEE' };
    productions = [p, ...productions];
    return delay(p);
  },
  moveProduction: (id: string, statut: StatutProduction) => {
    productions = productions.map((p) => (p.id === id ? { ...p, statut } : p));
    return delay(productions.find((p) => p.id === id)!);
  },
  reservations: () => delay([...reservations].sort((a, b) => a.date.localeCompare(b.date))),
  reserver: (r: Omit<Reservation, 'id'>) => {
    const nr: Reservation = { ...r, id: `r${Date.now()}` };
    reservations = [...reservations, nr];
    return delay(nr);
  },
  equipements: () => delay([] as Equipement[]),
  createEquipement: (nom: string, categorie?: string) => delay({ id: `eq${Date.now()}`, nom, categorie, disponible: true } as Equipement),
  updateEquipement: (id: string, patch: Partial<Equipement>) => delay({ id, nom: '', disponible: true, ...patch } as Equipement),
};

// --- HTTP ---------------------------------------------------------------------
const httpApi = {
  productions: () => api.get<Production[]>('/productions').then((r) => r.data),
  createProduction: (titre: string, type: TypeProduction) =>
    api.post<Production>('/productions', { titre, type }).then((r) => r.data),
  moveProduction: (id: string, statut: StatutProduction) =>
    api.patch<Production>(`/productions/${id}`, { statut }).then((r) => r.data),
  reservations: () => api.get<Reservation[]>('/reservations-studio').then((r) => r.data),
  reserver: (r: Omit<Reservation, 'id'>) =>
    api.post<Reservation>('/reservations-studio', r).then((r2) => r2.data),
  equipements: () => api.get<Equipement[]>('/equipements-studio').then((r) => r.data),
  createEquipement: (nom: string, categorie?: string) =>
    api.post<Equipement>('/equipements-studio', { nom, categorie }).then((r) => r.data),
  updateEquipement: (id: string, patch: Partial<Equipement>) =>
    api.patch<Equipement>(`/equipements-studio/${id}`, patch).then((r) => r.data),
};

export const studioService = USE_MOCKS.studio ? mockApi : httpApi;
