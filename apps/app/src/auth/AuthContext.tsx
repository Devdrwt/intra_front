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
      .then((u) => active && setUser(u))
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

/** Libellé d'affichage dérivé de l'email (tant qu'aucun nom de profil n'existe). */
export function displayName(u: Pick<User, 'email'>): string {
  const local = u.email.split('@')[0] ?? u.email;
  return local
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}
