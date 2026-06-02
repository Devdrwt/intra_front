import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authService } from '@/features/auth/service';

/** Profil de session — shape renvoyé par `GET /auth/me` (intra_back). */
export interface User {
  userId: string;
  tenantId: string;
  email: string;
  roles: string[];
  permissions: string[];
}

interface AuthState {
  user: User | null;
  /** true pendant la restauration de session au démarrage */
  booting: boolean;
  loading: boolean;
  login: (tenantSlug: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);

  // Restauration de session : un GET /auth/me établit aussi le cookie CSRF.
  useEffect(() => {
    let active = true;
    authService
      .me()
      // Un token périmé peut renvoyer un profil incomplet → on le rejette
      // (redirection login → re-login → JWT à jour). Évite un crash sur user partiel.
      .then((u) => active && setUser(isValidUser(u) ? u : null))
      .catch(() => active && setUser(null))
      .finally(() => active && setBooting(false));
    return () => {
      active = false;
    };
  }, []);

  const login = async (tenantSlug: string, email: string, password: string) => {
    setLoading(true);
    try {
      const { user: u } = await authService.login({ tenantSlug, email, password });
      setUser(u);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      location.assign('/login');
    }
  };

  const value = useMemo<AuthState>(
    () => ({ user, booting, loading, login, logout }),
    [user, booting, loading],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>');
  return ctx;
}

/** Vrai si l'utilisateur possède la permission (ou le wildcard `*`). Null-safe. */
export function hasPermission(user: User | null, perm: string): boolean {
  const perms = user?.permissions;
  if (!Array.isArray(perms)) return false;
  return perms.includes('*') || perms.includes(perm);
}

/** Libellé d'affichage dérivé de l'email (tant qu'aucun nom de profil n'existe). Null-safe. */
export function displayName(u?: Pick<User, 'email'> | null): string {
  const email = u?.email;
  if (!email) return 'Collaborateur';
  const local = email.split('@')[0] || email;
  return local
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/** Un profil de session est exploitable seulement s'il porte au moins userId + email. */
function isValidUser(u: unknown): u is User {
  return (
    typeof u === 'object' &&
    u !== null &&
    typeof (u as User).email === 'string' &&
    typeof (u as User).userId === 'string'
  );
}
