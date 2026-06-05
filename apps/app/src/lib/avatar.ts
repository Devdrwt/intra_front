const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

/**
 * URL de l'image de profil d'un utilisateur (ou undefined s'il n'en a pas).
 * Le cookie de session part avec la requête <img> (même-site).
 */
export function avatarUrl(
  userId: string,
  hasAvatar: boolean,
  version?: string | number,
): string | undefined {
  if (!hasAvatar) return undefined;
  return `${API_BASE}/avatars/${userId}${version ? `?v=${version}` : ''}`;
}
