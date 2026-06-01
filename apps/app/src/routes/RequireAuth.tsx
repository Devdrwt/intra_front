import { Navigate, useLocation } from 'react-router-dom';
import { Spinner } from '@drwindesk/ui';
import { useAuth } from '@/auth/AuthContext';
import type { ReactNode } from 'react';

/**
 * Garde de route. L'état d'auth vient du contexte (résultat de `GET /auth/me`),
 * pas du localStorage : les cookies de session sont httpOnly, illisibles côté front.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { user, booting } = useAuth();

  if (booting) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <>{children}</>;
}
