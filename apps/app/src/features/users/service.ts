import { api } from '@/lib/api';
import { USE_MOCKS } from '@/lib/config';
import type { InviteResult, InviteUserInput, UpdateUserInput, User } from './types';

/**
 * Service Utilisateurs & accès (côté admin). MOCK par défaut ; API NestJS avec
 * `VITE_MOCK_USERS=false`. Endpoints (intra_back, module users) :
 *   GET    /users        → UserDto[]
 *   GET    /users/:id    → UserDto
 *   POST   /users        InviteUserDto → { user, tempPassword? }
 *   PATCH  /users/:id    UpdateUserDto → UserDto
 *   DELETE /users/:id    → 204
 */
const delay = <T>(value: T, ms = 200): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

// --- MOCK ---------------------------------------------------------------------
let store: User[] = [
  {
    id: 'u1',
    email: 'admin@drwintech.com',
    firstName: 'Admin',
    lastName: 'Drwintech',
    status: 'ACTIVE',
    roles: ['admin'],
    lastLoginAt: new Date(Date.now() - 3_600_000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 86_400_000).toISOString(),
  },
  {
    id: 'u2',
    email: 'emile.adjovi@drwintech.com',
    firstName: 'Émile',
    lastName: 'Adjovi',
    status: 'INVITED',
    roles: ['employee'],
    createdAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
  },
];
let seq = store.length;

const mockApi = {
  list: () => delay([...store].sort((a, b) => b.createdAt.localeCompare(a.createdAt))),
  get: (id: string) => delay(store.find((u) => u.id === id) ?? null),
  invite: (input: InviteUserInput): Promise<InviteResult> => {
    const user: User = {
      id: `u${++seq}`,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      status: 'INVITED',
      roles: input.roleKeys,
      createdAt: new Date().toISOString(),
    };
    store = [user, ...store];
    return delay({ user, tempPassword: input.password ? undefined : 'Temp-' + Math.abs(seq * 7919).toString(36) });
  },
  update: (id: string, input: UpdateUserInput) => {
    store = store.map((u) =>
      u.id === id
        ? {
            ...u,
            firstName: input.firstName ?? u.firstName,
            lastName: input.lastName ?? u.lastName,
            status: input.status ?? u.status,
            roles: input.roleKeys ?? u.roles,
          }
        : u,
    );
    return delay(store.find((u) => u.id === id)!);
  },
  remove: (id: string) => {
    store = store.filter((u) => u.id !== id);
    return delay(undefined);
  },
};

// --- HTTP (NestJS) ------------------------------------------------------------
const httpApi = {
  list: () => api.get<User[]>('/users').then((r) => r.data),
  get: (id: string) => api.get<User>(`/users/${id}`).then((r) => r.data),
  invite: (input: InviteUserInput) =>
    api.post<InviteResult>('/users', input).then((r) => r.data),
  update: (id: string, input: UpdateUserInput) =>
    api.patch<User>(`/users/${id}`, input).then((r) => r.data),
  remove: (id: string) => api.delete(`/users/${id}`).then(() => undefined),
};

export const usersService = USE_MOCKS.users ? mockApi : httpApi;
