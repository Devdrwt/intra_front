export type StatutProjet = 'PLANIFIE' | 'EN_COURS' | 'EN_PAUSE' | 'LIVRE' | 'ANNULE';

export interface ProjectPerson {
  id: string;
  nom: string;
  prenom: string;
}

export interface ProjectDocument {
  id: string;
  nom: string;
  size: number | null;
  type: string | null;
  createdAt: string;
}

/** Lien d'accès à une ressource du projet (drive, dépôt, environnement…). */
export interface ProjectLien {
  label: string;
  url: string;
}

export interface Project {
  id: string;
  nom: string;
  description: string | null;
  statut: StatutProjet;
  client: string | null;
  progression: number;
  dateDebut: string | null;
  dateFin: string | null;
  livrableUrl: string | null;
  responsable: ProjectPerson | null;
  membres: ProjectPerson[];
  documents: ProjectDocument[];
  /** Partenaires associés au projet (optionnel, additif). */
  partenaires?: string[];
  /** Liens d'accès (drive, dépôt, env de test…) (optionnel, additif). */
  liens?: ProjectLien[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectInput {
  nom: string;
  description?: string;
  statut?: StatutProjet;
  client?: string;
  progression?: number;
  dateDebut?: string;
  dateFin?: string;
  livrableUrl?: string;
  responsableId?: string;
  membreIds?: string[];
}

export interface ProjectFilters {
  statut?: StatutProjet | '';
  q?: string;
}

export const STATUT_PROJET_LABEL: Record<StatutProjet, string> = {
  PLANIFIE: 'Planifié',
  EN_COURS: 'En cours',
  EN_PAUSE: 'En pause',
  LIVRE: 'Livré',
  ANNULE: 'Annulé',
};

export const STATUT_PROJET_OPTIONS = (Object.keys(STATUT_PROJET_LABEL) as StatutProjet[]).map(
  (value) => ({ value, label: STATUT_PROJET_LABEL[value] }),
);

export const STATUT_PROJET_TONE: Record<
  StatutProjet,
  'neutral' | 'brand' | 'success' | 'warning' | 'danger'
> = {
  PLANIFIE: 'neutral',
  EN_COURS: 'brand',
  EN_PAUSE: 'warning',
  LIVRE: 'success',
  ANNULE: 'danger',
};

/** Indicateur d'échéance : retard / bientôt / ok (pour projets non terminés). */
export function echeanceInfo(
  dateFin: string | null,
  statut: StatutProjet,
): { tone: 'danger' | 'warning' | 'neutral'; label: string } | null {
  if (!dateFin || statut === 'LIVRE' || statut === 'ANNULE') return null;
  const end = new Date(dateFin).getTime();
  const now = Date.now();
  const days = Math.ceil((end - now) / 86_400_000);
  if (days < 0) return { tone: 'danger', label: `En retard de ${-days} j` };
  if (days <= 7) return { tone: 'warning', label: days === 0 ? "Échéance aujourd'hui" : `J-${days}` };
  return { tone: 'neutral', label: `Échéance dans ${days} j` };
}
