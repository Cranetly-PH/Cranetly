import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Building, MapPin, Phone, Save, Camera, CheckCircle, XCircle, ShieldCheck } from 'lucide-react';
import { uploadImage } from '../../lib/api';

export function UserProfile() {
  const { user, profile, updateUserProfile, resetPassword } = useAuth();
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || user?.name || '',
    company_name: profile?.company_name || '',
    location: profile?.location || '',
    phone: profile?.phone || '',
    bio: profile?.bio || '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [resetingPassword, setResetingPassword] = useState(false);

  function handleChange(e) {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setSaved(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await updateUserProfile(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const url = await uploadImage(file, 'avatars');
      await updateUserProfile({ avatar_url: url });
    } catch (err) {
      setError('Failed to upload avatar.');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleResetPassword() {
    if (!window.confirm('Send a password reset link to your email?')) return;
    setResetingPassword(true);
    try {
      await resetPassword(user.email);
      alert('Reset link sent! Please check your email.');
    } catch (err) {
      setError(err.message || 'Failed to send reset link.');
    } finally {
      setResetingPassword(false);
    }
  }

  const verifications = [
    { label: 'Email', verified: profile?.is_email_verified ?? user?.isEmailVerified ?? false },
    { label: 'Phone', verified: profile?.is_phone_verified ?? user?.isPhoneVerified ?? false },
    { label: 'ID', verified: profile?.is_id_verified ?? user?.isIdVerified ?? false },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl text-gray-900 dark:text-white font-bold">Profile Settings</h1>

      {/* Cover & Avatar */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600" />
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-16 sm:-mt-12">
            <div className="relative">
              <div className="h-24 w-24 rounded-full border-4 border-white dark:border-gray-800 overflow-hidden bg-gray-200 flex items-center justify-center">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="h-12 w-12 text-gray-400" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 text-white hover:bg-blue-700 transition-colors cursor-pointer">
                <Camera className="h-4 w-4" />
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
              {uploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-full">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-6 text-center sm:text-left">
              <h2 className="text-xl text-gray-900 dark:text-white font-semibold">{user?.name}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">{user?.email}</p>
              <span className="inline-block mt-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 text-xs rounded capitalize">
                {user?.type}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Form */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg text-gray-900 dark:text-white font-medium">Personal Information</h3>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="full_name" className="block text-sm text-gray-700 dark:text-gray-300">Full Name</label>
                  <div className="mt-1 relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text" name="full_name" id="full_name"
                      value={formData.full_name} onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300">Email Address</label>
                  <div className="mt-1 relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email" value={user?.email || ''} disabled
                      className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="company_name" className="block text-sm text-gray-700 dark:text-gray-300">Company</label>
                  <div className="mt-1 relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text" name="company_name" id="company_name"
                      value={formData.company_name} onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm text-gray-700 dark:text-gray-300">Phone Number</label>
                  <div className="mt-1 relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="tel" name="phone" id="phone"
                      value={formData.phone} onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="location" className="block text-sm text-gray-700 dark:text-gray-300">Location</label>
                  <div className="mt-1 relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text" name="location" id="location"
                      value={formData.location} onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="bio" className="block text-sm text-gray-700 dark:text-gray-300">Bio</label>
                  <textarea
                    name="bio" id="bio" rows={4}
                    value={formData.bio} onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          {/* Verification Status */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg text-gray-900 dark:text-white font-medium">Verification</h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              {verifications.map(v => (
                <div key={v.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    {v.verified
                      ? <CheckCircle className="h-4 w-4 text-green-500" />
                      : <XCircle className="h-4 w-4 text-gray-300" />
                    }
                    <span className={v.verified ? 'text-gray-900 dark:text-white' : 'text-gray-500'}>
                      {v.label}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${v.verified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {v.verified ? 'Verified' : 'Pending'}
                  </span>
                </div>
              ))}
              <a
                href="/profile/verify"
                className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium pt-2"
              >
                Complete Verifications →
              </a>
            </div>
          </div>

          {/* Account Security */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg text-gray-900 dark:text-white font-medium flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-blue-600" />
                Security
              </h3>
            </div>
            <div className="px-6 py-6">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Send a secure password reset link to your email address to change your password.
              </p>
              <button
                onClick={handleResetPassword}
                disabled={resetingPassword}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {resetingPassword ? 'Sending...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
