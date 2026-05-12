import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Building2, Truck, UserCircle, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

export function AccountTypeSelection() {
  const { completeSignup, isAuthenticated, loading, user, isNewGoogleUser } = useAuth();
  const navigate = useNavigate();
  const [isSelecting, setIsSelecting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Wait until Supabase has fully resolved the session before making any decisions
    if (loading) return;

    if (!isAuthenticated) {
      // Definitively not logged in — send to signup
      navigate('/signup', { replace: true });
      return;
    }

    // Returning Google user who already picked an account type → skip this screen
    if (isAuthenticated && user?.type && user.type !== 'guest' && !isNewGoogleUser) {
      const signupData = sessionStorage.getItem('signupData');
      if (!signupData) {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [loading, isAuthenticated, user, isNewGoogleUser, navigate]);

  async function handleSelectType(type) {
    setIsSelecting(true);
    setError('');
    try {
      await completeSignup(type);
      sessionStorage.removeItem('signupData');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to set account type. Please try again.');
    } finally {
      setIsSelecting(false);
    }
  }

  // Show spinner while Supabase is exchanging the OAuth code / resolving session
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-600 text-sm">Signing you in...</p>
        </div>
      </div>
    );
  }

  // Don't render the card grid until we know the user is authenticated
  if (!isAuthenticated) return null;

  const accountTypes = [
    {
      type: 'business',
      title: 'Business',
      description: 'Post requests for supplies and materials, manage procurement',
      icon: Building2,
      colorClass: 'bg-blue-100',
      iconClass: 'text-blue-600',
      ringClass: 'focus:ring-blue-400 hover:ring-2 hover:ring-blue-300',
    },
    {
      type: 'supplier',
      title: 'Supplier',
      description: 'Respond to business needs, offer products and services',
      icon: Truck,
      colorClass: 'bg-green-100',
      iconClass: 'text-green-600',
      ringClass: 'focus:ring-green-400 hover:ring-2 hover:ring-green-300',
    },
    {
      type: 'guest',
      title: 'Guest',
      description: 'Browse and explore the marketplace without commitments',
      icon: UserCircle,
      colorClass: 'bg-gray-100',
      iconClass: 'text-gray-600',
      ringClass: 'focus:ring-gray-400 hover:ring-2 hover:ring-gray-300',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full space-y-8">

        <div className="text-center">
          <div className="flex justify-center">
            <TrendingUp className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl text-gray-900">Choose your account type</h2>
          <p className="mt-2 text-sm text-gray-600">
            Select the option that best describes how you'll use EconoConnect
          </p>
          {user?.name && (
            <p className="mt-2 text-sm text-blue-600">
              Welcome, {user.name}!
            </p>
          )}
        </div>

        {error && (
          <div className="text-center text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {accountTypes.map(accountType => (
            <button
              key={accountType.type}
              onClick={() => handleSelectType(accountType.type)}
              disabled={isSelecting}
              className={`bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 ${accountType.ringClass} disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={`p-4 rounded-full ${accountType.colorClass}`}>
                  <accountType.icon className={`h-12 w-12 ${accountType.iconClass}`} />
                </div>
                <div>
                  <h3 className="text-xl text-gray-900">{accountType.title}</h3>
                  <p className="mt-2 text-sm text-gray-600">{accountType.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {isSelecting && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-sm text-gray-500">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              Setting up your account...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
