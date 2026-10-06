import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Spinner from './Spinner.jsx';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner label="Validando sesión..." />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/" replace />;

  return children;
}
