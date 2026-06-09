import { api } from '@/lib/api';
import { USE_MOCKS } from '@/lib/config';

/**
 * SIRH : Onboarding/Offboarding (cf. docs/contracts/rh-onboarding.md).
 * VITE_MOCK_ONBOARDING=false → réel. /parcours · /etapes-parcours/:id
 */
export type TypeParcours = 'ONBOARDING' | 'OFFBOARDING';
export interface EtapeParcours {
  id: string;
  titre: string;
  responsable: string;
  faite: boolean;
  echeance?: string;
}
export interface Parcours {
  id: string;
  type: TypeParcours;
  employeNom: string;
  statut: 'EN_COURS' | 'TERMINE' | 'ANNULE';
  dateReference: string;
  etapes: EtapeParcours[];
}

const delay = <T>(value: T, ms = 150): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

// --- MOCK ---------------------------------------------------------------------
let parcours: Parcours[] = [
  {
    id: 'pc1', type: 'ONBOARDING', employeNom: 'Awa Koffi', statut: 'EN_COURS', dateReference: '2026-06-01',
    etapes: [
      { id: 'e1', titre: 'Créer le compte email', responsable: 'IT', faite: true },
      { id: 'e2', titre: 'Remettre le matériel', responsable: 'IT', faite: true },
      { id: 'e3', titre: 'Signer le contrat', responsable: 'RH', faite: false, echeance: '2026-06-05' },
      { id: 'e4', titre: 'Présentation équipe', responsable: 'Manager', faite: false },
    ],
  },
  {
    id: 'pc2', type: 'OFFBOARDING', employeNom: 'Paul Mensah', statut: 'EN_COURS', dateReference: '2026-06-15',
    etapes: [
      { id: 'e5', titre: 'Récupérer le matériel', responsable: 'IT', faite: false },
      { id: 'e6', titre: 'Clôturer les accès', responsable: 'IT', faite: false },
      { id: 'e7', titre: 'Solde tout compte', responsable: 'Finance', faite: false },
    ],
  },
];

const mockApi = {
  list: () => delay([...parcours]),
  toggleEtape: (parcoursId: string, etapeId: string): Promise<EtapeParcours> => {
    let updated: EtapeParcours | undefined;
    parcours = parcours.map((p) =>
      p.id !== parcoursId
        ? p
        : {
            ...p,
            etapes: p.etapes.map((e) => {
              if (e.id !== etapeId) return e;
              updated = { ...e, faite: !e.faite };
              return updated;
            }),
          },
    );
    return delay(updated as EtapeParcours);
  },
};

// --- HTTP ---------------------------------------------------------------------
const httpApi = {
  list: () => api.get<Parcours[]>('/parcours').then((r) => r.data),
  toggleEtape: (_parcoursId: string, etapeId: string) =>
    api.patch<EtapeParcours>(`/etapes-parcours/${etapeId}`, { faite: true }).then((r) => r.data),
};

export const onboardingService = USE_MOCKS.onboarding ? mockApi : httpApi;
