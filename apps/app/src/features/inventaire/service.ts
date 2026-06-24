import { api } from '@/lib/api';
import { USE_MOCKS } from '@/lib/config';

/**
 * Inventaire & immobilisations (cf. docs/contracts/inventaire.md). VITE_MOCK_INVENTAIRE=false → réel.
 *   /biens (GET/POST/PATCH/DELETE) · /biens/stats · /categories-bien
 */
export type TypeBien = 'IMMOBILISATION' | 'CONSOMMABLE';
export type EtatBien = 'NEUF' | 'BON' | 'USAGE' | 'HORS_SERVICE' | 'REFORME';

export interface Bien {
  id: string;
  reference: string;
  nom: string;
  type: TypeBien;
  categorie?: string;
  etat: EtatBien;
  quantite: number;
  valeurAcquisition?: number;
  dateAcquisition?: string;
  localisation?: string;
  affecteA?: string;
  dureeAmortissementMois?: number;
  valeurNette?: number;
}
export interface BienInput {
  nom: string;
  type: TypeBien;
  categorie?: string;
  etat: EtatBien;
  quantite: number;
  valeurAcquisition?: number;
  dureeAmortissementMois?: number;
  localisation?: string;
  affecteA?: string;
}

const delay = <T>(value: T, ms = 150): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

// --- MOCK ---------------------------------------------------------------------
const CATEGORIES = ['Informatique', 'Mobilier', 'Véhicule', 'Équipement studio', 'Outillage'];
let seq = 4;
let biens: Bien[] = [
  { id: 'b1', reference: 'INV-2026-0001', nom: 'Ordinateur portable Dell', type: 'IMMOBILISATION', categorie: 'Informatique', etat: 'BON', quantite: 1, valeurAcquisition: 650_000, dateAcquisition: '2025-02-10', localisation: 'Siège — Bureau 2', affecteA: 'Awa Koffi' },
  { id: 'b2', reference: 'INV-2026-0002', nom: 'Bureau + fauteuil', type: 'IMMOBILISATION', categorie: 'Mobilier', etat: 'BON', quantite: 1, valeurAcquisition: 180_000, dateAcquisition: '2024-09-01', localisation: 'Siège — Open space' },
  { id: 'b3', reference: 'INV-2026-0003', nom: 'Micro Rode + casque', type: 'IMMOBILISATION', categorie: 'Équipement studio', etat: 'NEUF', quantite: 2, valeurAcquisition: 320_000, dateAcquisition: '2026-01-20', localisation: 'Studio' },
  { id: 'b4', reference: 'INV-2026-0004', nom: 'Pick-up Toyota Hilux', type: 'IMMOBILISATION', categorie: 'Véhicule', etat: 'USAGE', quantite: 1, valeurAcquisition: 12_000_000, dateAcquisition: '2022-05-15', localisation: 'Parking' },
];

const mockApi = {
  categories: () => delay([...CATEGORIES]),
  list: (search?: string, categorie?: string, etat?: string) =>
    delay(
      biens.filter(
        (b) =>
          (!categorie || b.categorie === categorie) &&
          (!etat || b.etat === etat) &&
          (!search || `${b.reference} ${b.nom} ${b.affecteA ?? ''}`.toLowerCase().includes(search.toLowerCase())),
      ),
    ),
  stats: () => {
    const byCat: Record<string, number> = {};
    let total = 0;
    for (const b of biens) {
      const v = (b.valeurAcquisition ?? 0) * b.quantite;
      byCat[b.categorie ?? 'Autre'] = (byCat[b.categorie ?? 'Autre'] ?? 0) + v;
      total += v;
    }
    return delay({ total, byCategorie: byCat, nbBiens: biens.length });
  },
  create: (input: BienInput) => {
    seq += 1;
    const b: Bien = { ...input, id: `b${seq}`, reference: `INV-2026-${String(seq).padStart(4, '0')}`, dateAcquisition: new Date().toISOString().slice(0, 10) };
    biens = [b, ...biens];
    return delay(b);
  },
  remove: (id: string) => {
    biens = biens.filter((b) => b.id !== id);
    return delay(undefined);
  },
};

// --- HTTP ---------------------------------------------------------------------
function params(search?: string, categorie?: string, etat?: string) {
  const p: Record<string, string> = {};
  if (search) p.search = search;
  if (categorie) p.categorieId = categorie;
  if (etat) p.etat = etat;
  return p;
}
const httpApi = {
  categories: () => api.get<{ nom: string }[]>('/categories-bien').then((r) => r.data.map((c) => c.nom)),
  list: (search?: string, categorie?: string, etat?: string) =>
    api.get<Bien[]>('/biens', { params: params(search, categorie, etat) }).then((r) => r.data),
  stats: () => api.get<{ total: number; byCategorie: Record<string, number>; nbBiens: number }>('/biens/stats').then((r) => r.data),
  create: (input: BienInput) => api.post<Bien>('/biens', input).then((r) => r.data),
  remove: (id: string) => api.delete(`/biens/${id}`).then(() => undefined),
};

export const inventaireService = USE_MOCKS.inventaire ? mockApi : httpApi;
