import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router';
import { User, Settings, HelpCircle, LogOut, ChevronDown } from 'lucide-react';

export function ProfileDropdown() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    await logout();
    navigate('/login');
    setIsOpen(false);
  }

  const menuItems = [
    { icon: User, label: 'Profile', onClick: () => { navigate('/profile'); setIsOpen(false); } },
    { icon: Settings, label: 'Settings', onClick: () => { navigate('/settings'); setIsOpen(false); } },
    { icon: HelpCircle, label: 'Help & Support', onClick: () => { alert('Help coming soon!'); setIsOpen(false); } },
    { icon: LogOut, label: 'Logout', onClick: handleLogout, isDanger: true },
  ];

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-2 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white overflow-hidden">
          {user?.avatar ? (
            <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
          )}
        </div>
        <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400 hidden sm:block" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-900 dark:text-white truncate">{user?.name || 'Loading user...'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{user?.email || ''}</p>
            {user?.type && (
              <span className="inline-block mt-2 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 text-xs rounded capitalize">
                {user.type}
              </span>
            )}
          </div>
          {menuItems.map((item, idx) => (
            <button
              key={idx}
              onClick={item.onClick}
              className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                item.isDanger ? 'text-red-600' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
