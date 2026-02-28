import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { AccreditationType } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireType?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin, requireType }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, hasTypeAccess } = useAuth();
  const { type } = useParams<{ type: AccreditationType }>();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-500">Carregant...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !user?.is_admin) {
    return <Navigate to="/" replace />;
  }

  if (requireType && type && !hasTypeAccess(type)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
