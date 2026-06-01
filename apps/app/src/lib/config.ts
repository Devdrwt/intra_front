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
const globalMock = import.meta.env.VITE_USE_MOCKS !== 'false';

/** 'true' → mock, 'false' → réel, sinon valeur par défaut du domaine. */
function flag(value: string | undefined, fallback: boolean): boolean {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

export const USE_MOCKS = {
  auth: flag(import.meta.env.VITE_MOCK_AUTH, false),
  rh: flag(import.meta.env.VITE_MOCK_RH, globalMock),
  presences: flag(import.meta.env.VITE_MOCK_PRESENCES, globalMock),
  documents: flag(import.meta.env.VITE_MOCK_DOCUMENTS, globalMock),
  rapports: flag(import.meta.env.VITE_MOCK_RAPPORTS, globalMock),
} as const;
