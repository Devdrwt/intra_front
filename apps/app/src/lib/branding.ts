const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

/**
 * URL du logo de l'organisation (servi par l'API, cookie même-site sur l'<img>).
 * 404 si aucun logo → le composant retombe sur le monogramme.
 */
export function orgLogoUrl(version?: string | number): string {
  return `${API_BASE}/settings/logo${version ? `?v=${version}` : ''}`;
}
