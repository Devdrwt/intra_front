/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  /** 'true' → mock toute l'auth (hors-ligne). Défaut : réel. */
  readonly VITE_MOCK_AUTH?: string;
  /** 'false' (global) → tous les modules métier en réel. Défaut : mock. */
  readonly VITE_USE_MOCKS?: string;
  /** Override par domaine : 'true' = mock, 'false' = réel. */
  readonly VITE_MOCK_RH?: string;
  readonly VITE_MOCK_PRESENCES?: string;
  readonly VITE_MOCK_DOCUMENTS?: string;
  readonly VITE_MOCK_RAPPORTS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
