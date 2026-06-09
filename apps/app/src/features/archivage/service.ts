import { api } from '@/lib/api';
import { USE_MOCKS } from '@/lib/config';

/**
 * GED : Archivage & rétention (cf. docs/contracts/ged-archivage.md). VITE_MOCK_ARCHIVAGE=false → réel.
 *   /archivage/stores · /archivage/politiques · /archives · /archives/:id/purger · /retention-legale
 */
export type TypeArchiveStore = 'LOCAL' | 'S3' | 'SCALEWAY' | 'AWS_GLACIER' | 'AZURE_BLOB' | 'GCS';
export interface ArchiveStore {
  id: string;
  nom: string;
  type: TypeArchiveStore;
  actif: boolean;
  parDefaut: boolean;
}
export interface PolitiqueArchivage {
  id: string;
  nom: string;
  typeDocument?: string;
  dureeConservationMois: number;
  actionEcheance: 'PURGER' | 'CONSERVER';
}
export type StatutArchive = 'ARCHIVE' | 'SOUS_RETENTION_LEGALE' | 'A_PURGER' | 'PURGE' | 'RESTAURE';
export interface ArchiveDocument {
  id: string;
  documentNom: string;
  storeNom: string;
  statut: StatutArchive;
  archivedAt: string;
  retentionUntil?: string;
  retentionLegale: boolean;
  tailleKo: number;
}

const delay = <T>(value: T, ms = 150): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

// --- MOCK ---------------------------------------------------------------------
let stores: ArchiveStore[] = [
  { id: 'st1', nom: 'Stockage local', type: 'LOCAL', actif: true, parDefaut: true },
  { id: 'st2', nom: 'Scaleway Glacier', type: 'SCALEWAY', actif: false, parDefaut: false },
];
const politiques: PolitiqueArchivage[] = [
  { id: 'po1', nom: 'Pièces comptables (OHADA)', typeDocument: 'COMPTABLE', dureeConservationMois: 120, actionEcheance: 'CONSERVER' },
  { id: 'po2', nom: 'Contrats', typeDocument: 'CONTRAT', dureeConservationMois: 60, actionEcheance: 'CONSERVER' },
];
let archives: ArchiveDocument[] = [
  { id: 'ar1', documentNom: 'Facture FF-2026-0001', storeNom: 'Stockage local', statut: 'ARCHIVE', archivedAt: '2026-01-15', retentionUntil: '2036-01-15', retentionLegale: false, tailleKo: 240 },
  { id: 'ar2', documentNom: 'Contrat CDI — Awa Koffi', storeNom: 'Stockage local', statut: 'SOUS_RETENTION_LEGALE', archivedAt: '2025-03-01', retentionUntil: '2030-03-01', retentionLegale: true, tailleKo: 180 },
];

const mockApi = {
  stores: () => delay([...stores]),
  toggleStore: (id: string) => {
    stores = stores.map((s) => (s.id === id ? { ...s, actif: !s.actif } : s));
    return delay(stores.find((s) => s.id === id)!);
  },
  politiques: () => delay([...politiques]),
  archives: () => delay([...archives]),
  toggleRetention: (id: string) => {
    archives = archives.map((a) =>
      a.id === id ? { ...a, retentionLegale: !a.retentionLegale, statut: !a.retentionLegale ? 'SOUS_RETENTION_LEGALE' : 'ARCHIVE' } : a,
    );
    return delay(archives.find((a) => a.id === id)!);
  },
};

// --- HTTP ---------------------------------------------------------------------
const httpApi = {
  stores: () => api.get<ArchiveStore[]>('/archivage/stores').then((r) => r.data),
  toggleStore: (id: string) => api.patch<ArchiveStore>(`/archivage/stores/${id}`, {}).then((r) => r.data),
  politiques: () => api.get<PolitiqueArchivage[]>('/archivage/politiques').then((r) => r.data),
  archives: () => api.get<ArchiveDocument[]>('/archives').then((r) => r.data),
  toggleRetention: (id: string) =>
    api.post<ArchiveDocument>(`/archives/${id}/retention-legale`, { active: true }).then((r) => r.data),
};

export const archivageService = USE_MOCKS.archivage ? mockApi : httpApi;
