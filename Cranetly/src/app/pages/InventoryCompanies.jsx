import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Building2, Search, MapPin, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function InventoryCompanies() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCompanies();
  }, []);

  async function loadCompanies() {
    setLoading(true);
    try {
      // Get distinct companies/users who have inventory items
      const { data, error } = await supabase
        .from('inventory')
        .select('user_id, category, profiles:user_id(full_name, company_name, location, avatar_url)')
        .order('user_id');

      if (error) throw error;

      // Group by user
      const grouped = (data || []).reduce((acc, item) => {
        const userId = item.user_id;
        if (!acc[userId]) {
          acc[userId] = {
            id: userId,
            name: item.profiles?.company_name || item.profiles?.full_name || 'Unknown Company',
            location: item.profiles?.location || '',
            avatar: item.profiles?.avatar_url,
            categories: new Set(),
            itemCount: 0,
          };
        }
        acc[userId].categories.add(item.category);
        acc[userId].itemCount++;
        return acc;
      }, {});

      setCompanies(Object.values(grouped).map(c => ({
        ...c,
        categories: Array.from(c.categories),
      })));
    } catch (err) {
      console.error('Failed to load companies:', err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = companies.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.categories.some(cat => cat.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900 dark:text-white">Inventory</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Browse companies and their inventory
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search companies..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No companies found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(company => (
            <button
              key={company.id}
              onClick={() => navigate(`/inventory/${company.id}`)}
              className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow p-6 text-left"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg flex-shrink-0">
                  {company.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-gray-900 dark:text-white truncate">{company.name}</h3>
                  {company.location && (
                    <div className="flex items-center gap-1 mt-1 text-sm text-gray-500 dark:text-gray-400">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{company.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 mt-1 text-sm text-gray-500 dark:text-gray-400">
                    <Package className="h-3 w-3" />
                    <span>{company.itemCount} items</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {company.categories.slice(0, 3).map(cat => (
                      <span key={cat} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 text-xs rounded">
                        {cat}
                      </span>
                    ))}
                    {company.categories.length > 3 && (
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                        +{company.categories.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
