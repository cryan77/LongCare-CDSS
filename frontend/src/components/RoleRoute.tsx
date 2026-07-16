import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store';
import { canAccessPath, homePathForRole } from '../roles';

/** Gate routes by role per doc/role.md access matrix */
export default function RoleRoute({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuthStore();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/app/login" replace state={{ from: location }} />;
  }

  if (user && !canAccessPath(user.role, location.pathname)) {
    return <Navigate to={homePathForRole(user.role)} replace />;
  }

  return <>{children}</>;
}
