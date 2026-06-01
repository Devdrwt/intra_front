import type { Employe } from './types';

/**
 * Jeu de données fictif pour développer le front sans backend.
 * Activé par défaut (voir service.ts) tant que l'API NestJS n'est pas branchée.
 */
export const MOCK_EMPLOYES: Employe[] = [
  {
    id: 'e1',
    matricule: 'DRW-001',
    nom: 'Kossou',
    prenom: 'Aïcha',
    email: 'aicha.kossou@drwintech.com',
    telephone: '+229 01 97 00 00 01',
    poste: 'Responsable RH',
    departement: 'Administration',
    service: 'Ressources Humaines',
    typeContrat: 'CDI',
    statut: 'ACTIF',
    dateEmbauche: '2023-02-01',
  },
  {
    id: 'e2',
    matricule: 'DRW-002',
    nom: 'Adjovi',
    prenom: 'Émile',
    email: 'emile.adjovi@drwintech.com',
    telephone: '+229 01 97 00 00 02',
    poste: 'Développeur full-stack',
    departement: 'Production',
    service: 'Ingénierie',
    typeContrat: 'CDI',
    statut: 'ACTIF',
    dateEmbauche: '2024-09-15',
  },
  {
    id: 'e3',
    matricule: 'DRW-003',
    nom: 'Houngbedji',
    prenom: 'Sarah',
    email: 'sarah.houngbedji@drwintech.com',
    poste: 'Designer UI/UX',
    departement: 'Production',
    service: 'Design',
    typeContrat: 'CDD',
    statut: 'CONGE',
    dateEmbauche: '2025-01-06',
    dateFinContrat: '2026-07-05',
  },
  {
    id: 'e4',
    matricule: 'DRW-004',
    nom: 'Tossou',
    prenom: 'Marc',
    email: 'marc.tossou@partenaire.com',
    poste: 'Consultant juridique',
    departement: 'Administration',
    typeContrat: 'PRESTATAIRE',
    statut: 'ACTIF',
    dateEmbauche: '2025-03-01',
    dateFinContrat: '2026-06-30',
  },
];

export const DEPARTEMENTS = ['Administration', 'Production', 'Commercial', 'Direction'];
