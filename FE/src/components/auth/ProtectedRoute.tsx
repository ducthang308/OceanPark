import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { RoleId } from '../../constants/roles';
import { useAuth } from '../../hooks/useAuth';

type ProtectedRouteProps = {
  allowedRoles?: readonly RoleId[];
  unauthorizedTo?: string;
};

const ProtectedRoute = ({
  allowedRoles,
  unauthorizedTo = '/',
}: ProtectedRouteProps) => {
  const location = useLocation();
  const { isAuthenticated, roleId } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles?.length && (!roleId || !allowedRoles.includes(roleId))) {
    return <Navigate to={unauthorizedTo} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
