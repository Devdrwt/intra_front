export type CandidatureStatut = 'RECUE' | 'EN_REVUE' | 'ENTRETIEN' | 'ACCEPTEE' | 'REFUSEE';

/** Réponse backend (siteweb.entities → CandidatureDto). */
export interface Candidature {
  id: string;
  nom: string;
  email: string;
  telephone?: string;
  poste?: string;
  message?: string;
  cvUrl?: string;
  statut: CandidatureStatut;
  createdAt: string; // ISO
}

/** Réponse backend (siteweb.entities → ContactMessageDto). */
export interface ContactMessage {
  id: string;
  nom: string;
  email: string;
  sujet?: string;
  message: string;
  traite: boolean;
  createdAt: string; // ISO
}

export const STATUT_LABEL: Record<CandidatureStatut, string> = {
  RECUE: 'Reçue',
  EN_REVUE: 'En revue',
  ENTRETIEN: 'Entretien',
  ACCEPTEE: 'Acceptée',
  REFUSEE: 'Refusée',
};

export const STATUT_OPTIONS = (Object.keys(STATUT_LABEL) as CandidatureStatut[]).map((value) => ({
  value,
  label: STATUT_LABEL[value],
}));
