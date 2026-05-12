import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Mail, Phone, CreditCard, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';
import { updateProfile } from '../../lib/api';

export function VerifyAccount() {
  const { user, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(null);

  async function handleVerify(type) {
    setVerifying(type);
    try {
      // In production: trigger real verification flow (email OTP, SMS, ID upload)
      // For now: simulate with a delay and update profile
      await new Promise(resolve => setTimeout(resolve, 1500));
      const field = `is_${type}_verified`;
      await updateUserProfile({ [field]: true });
      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} verified successfully!`);
    } catch (err) {
      alert('Verification failed. Please try again.');
    } finally {
      setVerifying(null);
    }
  }

  const verifications = [
    {
      type: 'email',
      label: 'Email Verification',
      description: 'Verify your email address to unlock basic features',
      icon: Mail,
      verified: user?.isEmailVerified,
    },
    {
      type: 'phone',
      label: 'Phone Verification',
      description: 'Verify your phone number for enhanced trust',
      icon: Phone,
      verified: user?.isPhoneVerified,
    },
    {
      type: 'id',
      label: 'ID Verification',
      description: 'Verify your identity to unlock all marketplace features',
      icon: CreditCard,
      verified: user?.isIdVerified,
    },
  ];

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/profile')}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
      >
        <ArrowLeft className="h-5 w-5" />
        Back to Profile
      </button>

      <div>
        <h1 className="text-2xl text-gray-900 dark:text-white">Account Verification</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Complete verifications to unlock all features and build trust with other users.
        </p>
      </div>

      <div className="space-y-4">
        {verifications.map(v => (
          <div key={v.type} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full ${v.verified ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-700'}`}>
                  <v.icon className={`h-6 w-6 ${v.verified ? 'text-green-600' : 'text-gray-500'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-gray-900 dark:text-white">{v.label}</h3>
                    {v.verified && <CheckCircle className="h-5 w-5 text-green-500" />}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{v.description}</p>
                </div>
              </div>
              {!v.verified ? (
                <button
                  onClick={() => handleVerify(v.type)}
                  disabled={verifying === v.type}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 flex-shrink-0"
                >
                  {verifying === v.type ? 'Verifying...' : 'Verify Now'}
                </button>
              ) : (
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 text-sm rounded-full flex-shrink-0">
                  Verified ✓
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
