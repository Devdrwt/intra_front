/**
 * Bascule mock ⇄ API réelle, par domaine.
 *
 * Le backend NestJS (`intra_back`) expose : `auth`, `health` et `rh` (module employés).
 * Les autres modules métier restent mockés jusqu'à leur implémentation côté backend.
 *
 * Défauts :
 *  - auth       : RÉEL (`VITE_MOCK_AUTH=true` pour bosser totalement hors-ligne).
 *  - rh         : MOCK par défaut pour rester jouable sans DB. `VITE_MOCK_RH=false`
 *                 quand le backend + PostgreSQL tournent (migration + seed faits).
 *  - presences  : MOCK (pas encore de backend).
 *  - documents  : MOCK (pas encore de backend).
 *
 * `VITE_USE_MOCKS=false` bascule d'un coup tous les domaines « métier » en réel ;
 * chaque `VITE_MOCK_<domaine>` reste prioritaire sur ce global.
 */

/** Nom d'affichage de l'organisation (le slug technique de connexion reste « drwintech »). */
export const ORG_NAME = import.meta.env.VITE_ORG_NAME || 'Drwintech Inc';

// Tout est branché sur le backend par défaut. Les mocks ne servent que de repli
// hors-ligne, et UNIQUEMENT si on les active explicitement (VITE_USE_MOCKS=true).
const globalMock = import.meta.env.VITE_USE_MOCKS === 'true';

/** 'true' → mock, 'false' → réel, sinon valeur par défaut du domaine. */
function flag(value: string | undefined, fallback: boolean): boolean {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

/**
 * Upload de fichiers (CV, documents GED) via URL presignée S3.
 * OFF par défaut : tant que le backend n'expose pas les endpoints `…/presign`,
 * les formulaires restent en mode métadonnées (rien ne casse). Passer à 'true'
 * une fois le presign backend disponible.
 */
export const UPLOADS_ENABLED = import.meta.env.VITE_UPLOADS_ENABLED === 'true';

export const USE_MOCKS = {
  auth: flag(import.meta.env.VITE_MOCK_AUTH, false),
  rh: flag(import.meta.env.VITE_MOCK_RH, globalMock),
  presences: flag(import.meta.env.VITE_MOCK_PRESENCES, globalMock),
  documents: flag(import.meta.env.VITE_MOCK_DOCUMENTS, globalMock),
  rapports: flag(import.meta.env.VITE_MOCK_RAPPORTS, globalMock),
  espaces: flag(import.meta.env.VITE_MOCK_ESPACES, globalMock),
  recrutement: flag(import.meta.env.VITE_MOCK_RECRUTEMENT, globalMock),
  users: flag(import.meta.env.VITE_MOCK_USERS, globalMock),
  // Référentiels (départements/services) : backend en place → suit le global comme
  // les autres modules. Override toujours possible via VITE_MOCK_SETTINGS.
  settings: flag(import.meta.env.VITE_MOCK_SETTINGS, globalMock),
  // Espace collaborateur (endpoints /me/...) : backend en place.
  me: flag(import.meta.env.VITE_MOCK_ME, globalMock),
  // Journal d'activité (audit) : endpoint GET /audit-logs.
  audit: flag(import.meta.env.VITE_MOCK_AUDIT, globalMock),
} as const;
