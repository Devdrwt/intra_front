import { api } from '@/lib/api';
import { USE_MOCKS } from '@/lib/config';
import type { User } from '@/auth/AuthContext';

/**
 * Service d'authentification — contrat aligné sur `intra_back` (/api/v1/auth).
 *  - login  → POST /auth/login  { tenantSlug, email, password } → { user, accessToken } (+ cookies)
 *  - me     → GET  /auth/me     (cookie dd_access) → user
 *  - logout → POST /auth/logout (révoque le refresh, efface les cookies)
 *
 * Le `tenantId` est dans le JWT : jamais envoyé par le front. La session web
 * repose sur les cookies httpOnly ; l'`accessToken` du body sert aux clients mobiles.
 */
export interface LoginPayload {
  tenantSlug: string;
  email: string;
  password: string;
}
interface LoginResult {
  user: User;
  accessToken: string;
}

// --- MOCK (hors-ligne) : session matérialisée par un marqueur localStorage ----
const MOCK_FLAG = 'dd_mock_session';
const MOCK_USER: User = {
  userId: 'u1',
  tenantId: 'drwintech',
  email: 'admin@drwintech.com',
  roles: ['admin'],
  permissions: ['*'],
};
const delay = <T>(value: T, ms = 200): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

const mockAuth = {
  login: ({ email }: LoginPayload) => {
    localStorage.setItem(MOCK_FLAG, '1');
    return delay({ user: { ...MOCK_USER, email: email || MOCK_USER.email }, accessToken: 'dev' });
  },
  me: (): Promise<User> =>
    localStorage.getItem(MOCK_FLAG)
      ? delay(MOCK_USER)
      : Promise.reject(new Error('Aucune session (mock).')),
  logout: () => {
    localStorage.removeItem(MOCK_FLAG);
    return delay(undefined);
  },
  setPassword: (_token: string, _password: string) => delay({ ok: true as const }),
};

// --- HTTP (NestJS) ------------------------------------------------------------
const httpAuth = {
  login: (payload: LoginPayload) =>
    api.post<LoginResult>('/auth/login', payload).then((r) => r.data),
  me: () => api.get<User>('/auth/me').then((r) => r.data),
  logout: () => api.post('/auth/logout').then(() => undefined),
  /** Définition du mot de passe via le token d'invitation (lien email). Public. */
  setPassword: (token: string, password: string) =>
    api.post<{ ok: true }>('/auth/set-password', { token, password }).then((r) => r.data),
};

export const authService = USE_MOCKS.auth ? mockAuth : httpAuth;
