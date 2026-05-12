import { useState, useRef, useEffect } from 'react';
import { Search, Clock, TrendingUp } from 'lucide-react';

export function SearchButton({ onSearch, selectedCategory }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const searches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    setRecentSearches(searches);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const popularSearches = [
    'clothes', 'food supplies', 'raw materials', 'electronics', 'furniture',
  ];

  const suggestedProducts = [
    'Industrial Steel Beams', 'Organic Fertilizer', 'LED Lighting Systems',
    'Office Furniture', 'Premium Coffee Beans', 'Packaging Materials',
  ];

  const filteredSuggestions = query
    ? suggestedProducts.filter(p => p.toLowerCase().includes(query.toLowerCase()))
    : [];

  function handleSearch(searchQuery) {
    if (!searchQuery.trim()) return;
    const searches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    const updated = [searchQuery, ...searches.filter(s => s !== searchQuery)].slice(0, 5);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
    setRecentSearches(updated);
    onSearch(searchQuery, selectedCategory);
    setIsOpen(false);
    setQuery('');
  }

  function handleSubmit(e) {
    e.preventDefault();
    handleSearch(query);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
      >
        <Search className="h-5 w-5 text-gray-700 dark:text-gray-300" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50">
          <form onSubmit={handleSubmit} className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search products..."
                autoFocus
                className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </form>

          <div className="max-h-64 overflow-y-auto">
            {filteredSuggestions.length > 0 ? (
              <div className="px-3 pb-3">
                {filteredSuggestions.map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => handleSearch(suggestion)}
                    className="w-full flex items-center gap-2 px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md text-left text-sm text-gray-700 dark:text-gray-300"
                  >
                    <Search className="h-4 w-4 text-gray-400" />
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : (
              <>
                {recentSearches.length > 0 && (
                  <div className="px-3 pb-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 px-2">Recent</p>
                    {recentSearches.map(search => (
                      <button
                        key={search}
                        onClick={() => handleSearch(search)}
                        className="w-full flex items-center gap-2 px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md text-left text-sm text-gray-700 dark:text-gray-300"
                      >
                        <Clock className="h-4 w-4 text-gray-400" />
                        {search}
                      </button>
                    ))}
                  </div>
                )}
                <div className="px-3 pb-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 px-2">Popular</p>
                  {popularSearches.map(search => (
                    <button
                      key={search}
                      onClick={() => handleSearch(search)}
                      className="w-full flex items-center gap-2 px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md text-left text-sm text-gray-700 dark:text-gray-300"
                    >
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                      {search}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
