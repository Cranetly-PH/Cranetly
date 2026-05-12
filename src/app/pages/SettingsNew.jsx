import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Bell, CreditCard, Share2, Users, FileText,
  ShieldCheck, Trash2, ChevronRight, User, Mail
} from 'lucide-react';
import { useNavigate } from 'react-router';

export function SettingsNew() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const settingsSections = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Edit Profile', onClick: () => navigate('/profile') },
        { icon: Mail, label: 'Email & Password', onClick: () => alert('Email settings — configure in your Supabase dashboard.') },
        { icon: Trash2, label: 'Delete Account', onClick: () => setShowDeleteModal(true), danger: true },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: Bell, label: 'Notifications', onClick: () => alert('Notification settings coming soon.') },
      ],
    },
    {
      title: 'Payment & Accounts',
      items: [
        { icon: CreditCard, label: 'Payment Methods', onClick: () => alert('Payment integration coming soon.') },
        { icon: Share2, label: 'Linked Social Accounts', onClick: () => alert('Social accounts coming soon.') },
      ],
    },
    {
      title: 'Legal & Support',
      items: [
        { icon: Users, label: 'Community Standards', onClick: () => alert('Community standards') },
        { icon: FileText, label: 'Terms of Service', onClick: () => alert('Terms of service') },
        { icon: ShieldCheck, label: 'Privacy Policy', onClick: () => alert('Privacy policy') },
      ],
    },
  ];

  async function handleDeleteAccount() {
    if (!window.confirm('Are you absolutely sure? This cannot be undone.')) return;
    await logout();
    navigate('/login');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Manage your account settings and preferences
        </p>
      </div>

      {/* User Info Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg">
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div>
          <p className="text-gray-900 dark:text-white">{user?.name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
          <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 text-xs rounded capitalize">
            {user?.type}
          </span>
        </div>
      </div>

      {settingsSections.map((section, idx) => (
        <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <h2 className="text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              {section.title}
            </h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {section.items.map((item, itemIdx) => (
              <button
                key={itemIdx}
                onClick={item.onClick}
                className={`w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  item.danger ? 'text-red-600' : 'text-gray-900 dark:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl text-gray-900 dark:text-white mb-4">Delete Account</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete your account? This action cannot be undone. All your data,
              products, and conversations will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
