import { useAuth } from '../context/AuthContext';
import { BusinessDashboard } from '../pages/BusinessDashboard';
import { SupplierDashboard } from '../pages/SupplierDashboard';
import { Dashboard } from '../pages/Dashboard';

export function RoleBasedDashboard() {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.type) {
    case 'business':
      return <BusinessDashboard />;
    case 'supplier':
      return <SupplierDashboard />;
    default:
      return <Dashboard />;
  }
}
