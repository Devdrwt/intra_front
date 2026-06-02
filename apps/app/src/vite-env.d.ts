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
  readonly VITE_MOCK_ESPACES?: string;
  readonly VITE_MOCK_RECRUTEMENT?: string;
  readonly VITE_MOCK_USERS?: string;
  /** Référentiels (départements/services). Défaut : mock (pas encore de backend). */
  readonly VITE_MOCK_SETTINGS?: string;
  /** 'true' → active l'upload de fichiers via presign S3. Défaut : off. */
  readonly VITE_UPLOADS_ENABLED?: string;
  /** URL de l'image de fond du login (défaut : photo Pexels). */
  readonly VITE_LOGIN_BG?: string;
  /** Nom d'affichage de l'organisation (défaut : « Drwintech Inc »). */
  readonly VITE_ORG_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
