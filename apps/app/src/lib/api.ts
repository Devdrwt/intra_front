import axios, { type InternalAxiosRequestConfig } from 'axios';

/**
 * Client API de l'ERP interne (contrat aligné sur `intra_back`).
 *
 * Auth par **cookies httpOnly** (`dd_access` / `dd_refresh`) posés par le backend :
 *  - `withCredentials: true` → les cookies partent et reviennent sur chaque appel.
 *  - Le `tenantId` n'est JAMAIS porté par le front : il est dans le JWT signé.
 *  - CSRF double-submit : sur les mutations, on renvoie la valeur du cookie
 *    `dd_csrf` (non-httpOnly) dans le header `x-csrf-token`.
 *  - Sur 401, on tente UN refresh (rotation des cookies) puis on rejoue la requête.
 *
 * En dev, `baseURL` relative (`/api/v1`) passe par le proxy Vite → cookies same-origin.
 */
const CSRF_COOKIE = 'dd_csrf';
const CSRF_HEADER = 'x-csrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  timeout: 20_000,
  withCredentials: true,
});

/**
 * Extrait le message d'erreur renvoyé par l'API NestJS (`{ message, error, statusCode }`).
 * `message` peut être une chaîne (ex. domaine email non autorisé) ou un tableau
 * (erreurs de validation class-validator). Repli sur `fallback` sinon.
 */
export function apiErrorMessage(err: unknown, fallback = 'Une erreur est survenue.'): string {
  if (axios.isAxiosError(err)) {
    const message = (err.response?.data as { message?: string | string[] } | undefined)?.message;
    if (Array.isArray(message) && message.length) return message.join(' ');
    if (typeof message === 'string' && message) return message;
  }
  return fallback;
}

api.interceptors.request.use((config) => {
  const method = (config.method ?? 'get').toUpperCase();
  if (!SAFE_METHODS.has(method)) {
    const csrf = readCookie(CSRF_COOKIE);
    if (csrf) config.headers[CSRF_HEADER] = csrf;
  }
  return config;
});

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

// Un seul refresh concurrent partagé par toutes les requêtes qui prennent un 401.
let refreshing: Promise<unknown> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const config = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const url = config?.url ?? '';
    const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/refresh');

    if (status === 401 && config && !config._retried && !isAuthRoute) {
      config._retried = true;
      try {
        refreshing = refreshing ?? api.post('/auth/refresh');
        await refreshing;
        return api(config);
      } catch (refreshError) {
        if (!location.pathname.startsWith('/login')) location.assign('/login');
        return Promise.reject(refreshError);
      } finally {
        refreshing = null;
      }
    }
    return Promise.reject(error);
  },
);
