// --- Pointage -----------------------------------------------------------------
export type PointageSens = 'ENTREE' | 'PAUSE' | 'REPRISE' | 'SORTIE';

export interface Pointage {
  id: string;
  employeId: string;
  date: string; // ISO yyyy-mm-dd
  heureEntree?: string; // HH:mm
  heurePauseDebut?: string; // HH:mm
  heurePauseFin?: string; // HH:mm
  heureSortie?: string; // HH:mm
  horsZone?: boolean;
  enMission?: boolean;
}

// --- Demandes (permissions / repos / congés) ---------------------------------
export type CategorieDemande = 'PERMISSION' | 'REPOS' | 'CONGE';
export type TypeConge = 'ANNUEL' | 'MALADIE' | 'SANS_SOLDE' | 'EXCEPTIONNEL';
export type StatutConge = 'EN_ATTENTE' | 'APPROUVE' | 'REFUSE';

export interface DemandeConge {
  id: string;
  employeId: string;
  categorie: CategorieDemande;
  type: TypeConge;
  dateDebut: string; // ISO
  dateFin: string; // ISO
  /** Permission / repos intra-journée : heures "HH:mm" (optionnel). */
  heureDebut?: string;
  heureFin?: string;
  motif?: string;
  statut: StatutConge;
  demandeLe: string; // ISO
}

export type DemandeCongeInput = Pick<
  DemandeConge,
  | 'employeId'
  | 'categorie'
  | 'type'
  | 'dateDebut'
  | 'dateFin'
  | 'heureDebut'
  | 'heureFin'
  | 'motif'
>;

export type SuiviPointage = Pointage & { employeNom: string };

// --- Missions -----------------------------------------------------------------
export interface Mission {
  id: string;
  employeId: string;
  objet: string;
  lieu: string | null;
  dateDebut: string; // yyyy-mm-dd
  dateFin: string;
  createdAt: string;
}
export interface MissionInput {
  employeId: string;
  objet: string;
  lieu?: string;
  dateDebut: string;
  dateFin: string;
}

export const CATEGORIE_LABEL: Record<CategorieDemande, string> = {
  PERMISSION: 'Permission',
  REPOS: 'Repos',
  CONGE: 'Congé',
};

export const TYPE_CONGE_LABEL: Record<TypeConge, string> = {
  ANNUEL: 'Congé annuel',
  MALADIE: 'Maladie',
  SANS_SOLDE: 'Sans solde',
  EXCEPTIONNEL: 'Exceptionnel',
};

export const TYPE_CONGE_OPTIONS = (Object.keys(TYPE_CONGE_LABEL) as TypeConge[]).map((value) => ({
  value,
  label: TYPE_CONGE_LABEL[value],
}));

export const STATUT_CONGE_LABEL: Record<StatutConge, string> = {
  EN_ATTENTE: 'En attente',
  APPROUVE: 'Approuvé',
  REFUSE: 'Refusé',
};

/** Nombre de jours calendaires inclus entre deux dates ISO. */
export function nbJours(dateDebut: string, dateFin: string): number {
  const d1 = new Date(dateDebut);
  const d2 = new Date(dateFin);
  if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) return 0;
  return Math.max(0, Math.round((d2.getTime() - d1.getTime()) / 86_400_000) + 1);
}

/** Durée d'une plage horaire "HH:mm" → "HH:mm", en heures (0 si invalide). */
export function dureeHeures(heureDebut?: string, heureFin?: string): number {
  if (!heureDebut || !heureFin) return 0;
  const toMin = (t: string): number => {
    const parts = t.split(':');
    const h = Number(parts[0]);
    const m = Number(parts[1] ?? '0');
    return Number.isNaN(h) || Number.isNaN(m) ? NaN : h * 60 + m;
  };
  const d = toMin(heureDebut);
  const f = toMin(heureFin);
  if (Number.isNaN(d) || Number.isNaN(f)) return 0;
  return Math.max(0, (f - d) / 60);
}

/**
 * Libellé lisible de durée : « 2 h (14:00–16:00) » pour une permission intra-journée,
 * sinon « N jour(s) ».
 */
export function dureeLabel(c: Pick<DemandeConge, 'dateDebut' | 'dateFin' | 'heureDebut' | 'heureFin'>): string {
  if (c.heureDebut && c.heureFin) {
    const h = dureeHeures(c.heureDebut, c.heureFin);
    return `${h.toLocaleString('fr-FR')} h (${c.heureDebut}–${c.heureFin})`;
  }
  return `${nbJours(c.dateDebut, c.dateFin)} j`;
}
