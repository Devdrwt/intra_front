'use client';

/**
 * Client API des formulaires PUBLICS du site (candidature, contact).
 *
 * Le backend NestJS protège toutes les mutations par CSRF double-submit, y compris
 * les routes publiques. On passe par le proxy Next (`/api/v1`, same-origin) pour que
 * les cookies fonctionnent sans CORS :
 *  1) un GET « amorce » pose le cookie `dd_csrf` (non-httpOnly, lisible en JS) ;
 *  2) le POST renvoie sa valeur dans l'en-tête `x-csrf-token`.
 */
const BASE = '/api/v1';

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

async function ensureCsrf(): Promise<string | null> {
  let token = readCookie('dd_csrf');
  if (!token) {
    // GET public qui déclenche le middleware CSRF et pose le cookie.
    await fetch(`${BASE}/equipe`, { credentials: 'include' }).catch(() => undefined);
    token = readCookie('dd_csrf');
  }
  return token;
}

export async function postPublic<T = unknown>(path: string, body: unknown): Promise<T> {
  const csrf = await ensureCsrf();
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(csrf ? { 'x-csrf-token': csrf } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let detail = '';
    try {
      detail = ((await res.json()) as { message?: string }).message ?? '';
    } catch {
      /* ignore */
    }
    throw new Error(detail || `Erreur ${res.status}`);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

/** Activation de l'upload de fichiers (CV) — off tant que le presign backend n'existe pas. */
export const UPLOADS_ENABLED = process.env.NEXT_PUBLIC_UPLOADS_ENABLED === 'true';

/**
 * Upload public via presign (CV de candidature). Contrat backend attendu :
 *   POST /candidatures/cv/presign { filename, contentType, size } → { uploadUrl, storageKey }
 * Le binaire est ensuite PUT directement sur `uploadUrl` (URL signée S3).
 */
export async function presignAndUpload(presignPath: string, file: File): Promise<string> {
  const contentType = file.type || 'application/octet-stream';
  const { uploadUrl, storageKey } = await postPublic<{ uploadUrl: string; storageKey: string }>(
    presignPath,
    { filename: file.name, contentType, size: file.size },
  );
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: file,
  });
  if (!res.ok) throw new Error(`Échec du transfert du fichier (${res.status}).`);
  return storageKey;
}
