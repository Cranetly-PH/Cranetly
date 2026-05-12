// ─── ProtectedRoute ───────────────────────────────────────────────────────────
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router';

export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  // Show the Layout structure even while loading auth.
  // This ensures the Navbar is visible immediately.
  // We only redirect once we are SURE (loading === false).
  if (loading) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
