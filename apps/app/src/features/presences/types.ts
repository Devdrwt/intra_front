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

/** Jours de la semaine — pour le repos hebdomadaire (catégorie REPOS). */
export type JourSemaine = 'LUN' | 'MAR' | 'MER' | 'JEU' | 'VEN' | 'SAM' | 'DIM';
export const JOURS_ORDER: JourSemaine[] = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];
export const JOUR_LABEL: Record<JourSemaine, string> = {
  LUN: 'Lundi', MAR: 'Mardi', MER: 'Mercredi', JEU: 'Jeudi', VEN: 'Vendredi', SAM: 'Samedi', DIM: 'Dimanche',
};
export const JOUR_COURT: Record<JourSemaine, string> = {
  LUN: 'Lun', MAR: 'Mar', MER: 'Mer', JEU: 'Jeu', VEN: 'Ven', SAM: 'Sam', DIM: 'Dim',
};
/** Libellé des jours de repos : « Samedi » / « Samedi, Dimanche ». */
export function joursReposLabel(jours?: JourSemaine[] | null): string {
  if (!jours || jours.length === 0) return '—';
  return JOURS_ORDER.filter((j) => jours.includes(j)).map((j) => JOUR_LABEL[j]).join(', ');
}

/** Cadence du repos : '' si chaque semaine, sinon « toutes les N semaines ». */
export function intervalleLabel(n?: number | null): string {
  return !n || n <= 1 ? 'chaque semaine' : `toutes les ${n} semaines`;
}

/** Options de cadence pour le formulaire de repos. */
export const REPOS_INTERVALLE_OPTIONS = [
  { value: '1', label: 'Chaque semaine' },
  { value: '2', label: 'Une semaine sur deux' },
  { value: '3', label: 'Toutes les 3 semaines' },
  { value: '4', label: 'Toutes les 4 semaines' },
];

export interface DemandeConge {
  id: string;
  employeId: string;
  categorie: CategorieDemande;
  type: TypeConge;
  dateDebut: string; // ISO — vide pour un REPOS hebdomadaire
  dateFin: string; // ISO — vide pour un REPOS hebdomadaire
  /** Permission intra-journée : heures "HH:mm" (optionnel). */
  heureDebut?: string;
  heureFin?: string;
  /** Repos hebdomadaire : jour(s) de la semaine (au lieu d'une plage de dates). */
  joursRepos?: JourSemaine[];
  /** Repos : cadence en semaines (1 = chaque semaine, 2 = une sur deux…). */
  reposIntervalleSemaines?: number;
  motif?: string;
  /** Justificatif joint (certificat médical…) — métadonnées seulement. */
  justificatif?: { name: string; size: number; type: string };
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
  | 'joursRepos'
  | 'reposIntervalleSemaines'
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
/**
 * Nombre de jours OUVRABLES (lundi → vendredi) entre deux dates incluses.
 * L'entreprise travaille 5 jours/semaine : samedi et dimanche ne comptent pas.
 * Calcul en UTC pour éviter les décalages de fuseau (dates « yyyy-mm-dd »).
 */
export function nbJours(dateDebut: string, dateFin: string): number {
  const p = (s: string) => {
    const [y, m, d] = s.split('-').map(Number);
    return y && m && d ? Date.UTC(y, m - 1, d) : NaN;
  };
  let cur = p(dateDebut);
  const end = p(dateFin);
  if (Number.isNaN(cur) || Number.isNaN(end) || end < cur) return 0;
  let count = 0;
  while (cur <= end) {
    const day = new Date(cur).getUTCDay(); // 0 = dimanche, 6 = samedi
    if (day !== 0 && day !== 6) count++;
    cur += 86_400_000;
  }
  return count;
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
