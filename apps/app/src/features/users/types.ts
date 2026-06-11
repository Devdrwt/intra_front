export type UserStatus = 'ACTIVE' | 'INVITED' | 'DISABLED';

/** Réponse backend (users/user.entity → UserDto). Jamais le passwordHash. */
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  status: UserStatus;
  roles: string[]; // clés de rôles
  extraPermissions: string[]; // modules activés en plus du rôle
  lastLoginAt?: string;
  createdAt: string;
}

/** Modules qu'un admin peut activer pour un utilisateur (miroir backend). */
export const MODULE_GRANTS: { permission: string; label: string }[] = [
  { permission: 'rh.employe:read', label: 'RH & Personnel' },
  { permission: 'presence:manage', label: 'Présences & Congés' },
  { permission: 'rapport:manage', label: 'Rapports' },
  { permission: 'project:read', label: 'Projets' },
  { permission: 'recrutement:read', label: 'Recrutement' },
  { permission: 'user:read', label: 'Utilisateurs & accès' },
  { permission: 'audit:read', label: 'Activité' },
];

/** Corps de POST /users (InviteUserDto). */
export interface InviteUserInput {
  email: string;
  firstName?: string;
  lastName?: string;
  roleKeys: string[];
  password?: string;
}

/**
 * Réponse d'invitation. Selon la config backend :
 *  - `invited: true` → un lien d'invitation a été envoyé par email (flux set-password) ;
 *  - `tempPassword` → mot de passe temporaire à communiquer (si pas d'email).
 */
export interface InviteResult {
  user: User;
  invited?: boolean;
  tempPassword?: string;
}

/** Corps de PATCH /users/:id (UpdateUserDto). */
export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  status?: UserStatus;
  roleKeys?: string[];
}

export const STATUT_LABEL: Record<UserStatus, string> = {
  ACTIVE: 'Actif',
  INVITED: 'Invité',
  DISABLED: 'Désactivé',
};

/**
 * Rôles connus (le backend n'expose pas encore d'endpoint /roles ; on liste
 * les rôles système du seed). À remplacer par un GET /roles le jour venu.
 */
export const ROLE_OPTIONS: { key: string; label: string }[] = [
  { key: 'admin', label: 'Administrateur' },
  { key: 'employee', label: 'Collaborateur' },
];

export function userLabel(u: Pick<User, 'firstName' | 'lastName' | 'email'>): string {
  const full = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();
  return full || u.email.split('@')[0] || u.email;
}
