import { useAuth } from '../context/AuthContext';
import { Image, Video, Smile } from 'lucide-react';

export function PostProductPrompt({ onOpenModal }) {
  const { user } = useAuth();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white flex-shrink-0 overflow-hidden">
          {user?.avatar ? (
            <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
          )}
        </div>
        <button
          onClick={onOpenModal}
          className="flex-1 text-left px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full text-gray-500 dark:text-gray-400 transition-colors"
        >
          Post a product or supply...
        </button>
      </div>
      <div className="flex items-center justify-around mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onOpenModal}
          className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-sm text-gray-600 dark:text-gray-400 transition-colors"
        >
          <Image className="h-5 w-5 text-green-600" />
          <span className="hidden sm:inline">Photo</span>
        </button>
        <button
          onClick={onOpenModal}
          className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-sm text-gray-600 dark:text-gray-400 transition-colors"
        >
          <Video className="h-5 w-5 text-red-600" />
          <span className="hidden sm:inline">Video</span>
        </button>
        <button
          onClick={onOpenModal}
          className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-sm text-gray-600 dark:text-gray-400 transition-colors"
        >
          <Smile className="h-5 w-5 text-yellow-600" />
          <span className="hidden sm:inline">Feeling</span>
        </button>
      </div>
    </div>
  );
}
