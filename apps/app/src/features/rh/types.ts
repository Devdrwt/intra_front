export type TypeContrat = 'CDI' | 'CDD' | 'STAGE' | 'PRESTATAIRE';
export type StatutEmploye = 'ACTIF' | 'CONGE' | 'SUSPENDU' | 'SORTI';

export interface Employe {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  poste: string;
  departement: string;
  service?: string;
  typeContrat: TypeContrat;
  statut: StatutEmploye;
  dateEmbauche: string; // ISO yyyy-mm-dd
  dateFinContrat?: string; // ISO — déclenche les alertes d'échéance
  photoUrl?: string;
}

/** Données du formulaire (sans les champs gérés par le backend). */
export type EmployeInput = Omit<Employe, 'id'>;

export interface EmployeFilters {
  search?: string;
  departement?: string;
  statut?: StatutEmploye | '';
}

export const TYPE_CONTRAT_OPTIONS: { value: TypeContrat; label: string }[] = [
  { value: 'CDI', label: 'CDI' },
  { value: 'CDD', label: 'CDD' },
  { value: 'STAGE', label: 'Stage' },
  { value: 'PRESTATAIRE', label: 'Prestataire' },
];

export const STATUT_OPTIONS: { value: StatutEmploye; label: string }[] = [
  { value: 'ACTIF', label: 'Actif' },
  { value: 'CONGE', label: 'En congé' },
  { value: 'SUSPENDU', label: 'Suspendu' },
  { value: 'SORTI', label: 'Sorti' },
];
