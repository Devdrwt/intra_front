import { Navigate, Outlet } from 'react-router-dom';
import { hasPermission, useAuth } from '@/auth/AuthContext';

/**
 * Garde de route par permission (espace admin). Si l'utilisateur ne détient pas
 * la permission, on le renvoie à son tableau de bord. Le backend reste l'autorité
 * (403 sur les API), ceci évite juste d'afficher un écran inaccessible.
 */
export function RequirePermission({ perm }: { perm: string }) {
  const { user } = useAuth();
  if (!hasPermission(user, perm)) return <Navigate to="/" replace />;
  return <Outlet />;
}
