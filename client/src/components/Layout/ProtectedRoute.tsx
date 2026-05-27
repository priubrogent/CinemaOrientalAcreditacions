import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { AccreditationType } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireType?: boolean;
  requireAccess?: AccreditationType; // check a specific type directly
}

export default function ProtectedRoute({ children, requireAdmin, requireType, requireAccess }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, hasTypeAccess } = useAuth();
  const { type } = useParams<{ type: AccreditationType }>();

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--paper)', color: 'var(--ink-50)', fontSize: '14px' }}>
        Carregant…
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

  if (requireAccess && !hasTypeAccess(requireAccess)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
