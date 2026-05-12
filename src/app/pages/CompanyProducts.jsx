import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Package, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function CompanyProducts() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(new Set());

  useEffect(() => {
    loadData();
  }, [companyId]);

  async function loadData() {
    setLoading(true);
    try {
      const [inventoryRes, profileRes] = await Promise.all([
        supabase
          .from('inventory')
          .select('*')
          .eq('user_id', companyId)
          .order('category')
          .order('name'),
        supabase
          .from('profiles')
          .select('full_name, company_name, location, avatar_url')
          .eq('id', companyId)
          .single(),
      ]);

      if (inventoryRes.error) throw inventoryRes.error;
      setItems(inventoryRes.data || []);
      if (!profileRes.error) {
        setCompany(profileRes.data);
        setExpandedCategories(new Set(
          [...new Set((inventoryRes.data || []).map(i => i.category))].slice(0, 1)
        ));
      }
    } catch (err) {
      console.error('Failed to load company inventory:', err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = filtered.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  function toggleCategory(catName) {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(catName)) next.delete(catName);
      else next.add(catName);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/inventory')}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
      >
        <ArrowLeft className="h-5 w-5" />
        Back to Inventory
      </button>

      {company && (
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl">
            {(company.company_name || company.full_name || 'C').charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl text-gray-900 dark:text-white">
              {company.company_name || company.full_name}
            </h1>
            {company.location && (
              <p className="text-sm text-gray-600 dark:text-gray-400">{company.location}</p>
            )}
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search inventory..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-3" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            </div>
          ))}
        </div>
      ) : Object.keys(categories).length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No inventory items found.</p>
        </div>
      ) : (
        Object.entries(categories).map(([catName, catItems]) => (
          <div key={catName} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <button
              onClick={() => toggleCategory(catName)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <div className="flex items-center gap-2">
                <h2 className="text-lg text-gray-900 dark:text-white">{catName}</h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">({catItems.length})</span>
              </div>
              <span className="text-gray-400">{expandedCategories.has(catName) ? '▲' : '▼'}</span>
            </button>

            {expandedCategories.has(catName) && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      {['Name', 'Group', 'Qty', 'Status', 'Price/Unit'].map(h => (
                        <th key={h} className="px-6 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {catItems.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900 dark:text-white">{item.name}</p>
                          {item.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">{item.description}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {item.group_number} {item.group_name && `· ${item.group_name}`}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{item.quantity}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs ${item.available ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}>
                            {item.available ? 'Available' : 'Unavailable'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{item.cost_per_unit_display || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
