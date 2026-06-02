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
