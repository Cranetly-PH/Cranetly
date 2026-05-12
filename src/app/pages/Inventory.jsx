import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, Edit, Trash2, Package, ChevronDown, ChevronRight, 
  AlertCircle, Building2, Search, Filter, ArrowLeft 
} from 'lucide-react';
import {
  inventoryService,
  companyService,
} from '../../lib/api';

export function Inventory() {
  const { user } = useAuth();

  // ─── CRITICAL FIX: single empty-dep effect owns isMounted ─────────────────
  const isMounted = useRef(false);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);
  // ──────────────────────────────────────────────────────────────────────────

  const [items, setItems] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(new Set());

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '', description: '', groupNumber: '', groupName: '',
    quantity: '', available: true, costPerUnit: '', category: '',
    companyId: '',
  });
  const [saving, setSaving] = useState(false);

  // ─── CRITICAL FIX: use user?.id (string) not user (object) as dep ─────────
  // If AuthContext returns a new user object reference on every render,
  // depending on `user` would recreate fetchInventory every render →
  // triggering the useEffect that calls it → infinite fetch loop.
  // Depending on `user?.id` (a stable string) prevents this.
  const fetchInventory = useCallback(async (signal) => {
    if (!user?.id) return;
    try {
      const data = await inventoryService.getInventory(
        user.id,
        selectedCompanyId === 'all' ? null : selectedCompanyId,
        signal
      );
      if (isMounted.current) setItems(data);
    } catch (err) {
      if (err?.name !== 'AbortError' && isMounted.current) {
        setError('Failed to load inventory.');
        console.error('[Inventory] fetch error:', err);
      }
    }
  }, [user?.id, selectedCompanyId]); // ← user?.id not user
  // ──────────────────────────────────────────────────────────────────────────

  // Combined initial load + refresh on company/user change
  useEffect(() => {
    if (!user?.id) return;

    const controller = new AbortController();

    async function init() {
      // Stale-while-revalidate: only show loader on first load
      if (isMounted.current) {
        setItems(prev => { if (prev.length === 0) setLoading(true); return prev; });
        setError('');
      }
      try {
        const promises = [fetchInventory(controller.signal)];
        // Only fetch companies if not yet loaded
        if (companies.length === 0) {
          promises.push(
            companyService.getCompanies(user.id).then(data => {
              if (isMounted.current) setCompanies(data);
            })
          );
        }
        await Promise.all(promises);
      } catch (err) {
        if (err?.name !== 'AbortError' && isMounted.current) {
          setError('Failed to load inventory data.');
        }
      } finally {
        if (isMounted.current) setLoading(false);
      }
    }

    init();
    return () => controller.abort();
  }, [user?.id, selectedCompanyId, fetchInventory]);

  // Silent refresh (after save/delete — no loading flash)
  const refreshInventory = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await inventoryService.getInventory(
        user.id,
        selectedCompanyId === 'all' ? null : selectedCompanyId
      );
      if (isMounted.current) setItems(data);
    } catch (err) {
      if (isMounted.current) setError('Failed to refresh inventory.');
    }
  }, [user?.id, selectedCompanyId]);

  const filteredItems = useMemo(() =>
    items.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    ),
  [items, searchQuery]);

  const categories = useMemo(() =>
    filteredItems.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {}),
  [filteredItems]);

  function toggleCategory(catName) {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(catName)) next.delete(catName);
      else next.add(catName);
      return next;
    });
  }

  function openAddModal(item = null) {
    if (item) {
      setEditingItem(item);
      setFormData({
        name:        item.name,
        description: item.description || '',
        groupNumber: item.group_number || '',
        groupName:   item.group_name || '',
        quantity:    String(item.quantity),
        available:   item.available,
        costPerUnit: item.cost_per_unit ? String(item.cost_per_unit) : '',
        category:    item.category,
        companyId:   item.company_id || '',
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '', description: '', groupNumber: '', groupName: '',
        quantity: '', available: true, costPerUnit: '', category: '',
        companyId: selectedCompanyId !== 'all' ? selectedCompanyId : '',
      });
    }
    setShowAddModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingItem) {
        await inventoryService.updateInventoryItem(editingItem.id, {
          name:          formData.name,
          description:   formData.description,
          group_number:  formData.groupNumber,
          group_name:    formData.groupName,
          quantity:      parseInt(formData.quantity) || 0,
          available:     formData.available,
          cost_per_unit: parseFloat(formData.costPerUnit) || null,
          category:      formData.category,
          company_id:    formData.companyId || null,
        });
      } else {
        await inventoryService.createInventoryItem(user.id, formData);
      }
      await refreshInventory();
      setShowAddModal(false);
    } catch (err) {
      setError(err.message || 'Failed to save item.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(itemId) {
    if (!window.confirm('Delete this item from inventory?')) return;
    try {
      await inventoryService.deleteInventoryItem(itemId);
      await refreshInventory();
    } catch (err) {
      if (isMounted.current) setError('Failed to delete item.');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {loading ? 'Loading…' : `${items.length} item${items.length !== 1 ? 's' : ''} tracked`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Company filter */}
          <select
            value={selectedCompanyId}
            onChange={e => setSelectedCompanyId(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md text-sm focus:outline-none focus:ring-blue-500"
          >
            <option value="all">All Companies</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.company_name}</option>
            ))}
          </select>
          <button
            onClick={() => openAddModal()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 text-sm transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search items…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md text-sm focus:outline-none focus:ring-blue-500"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Only show skeleton on first load with no data */}
      {loading && items.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4" />
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : Object.keys(categories).length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery ? 'No items match your search.' : 'No inventory items yet.'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => openAddModal()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              Add your first item
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(categories).map(([catName, catItems]) => (
            <div key={catName} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <button
                onClick={() => toggleCategory(catName)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {expandedCategories.has(catName)
                    ? <ChevronDown className="h-5 w-5 text-gray-400" />
                    : <ChevronRight className="h-5 w-5 text-gray-400" />
                  }
                  <span className="font-medium text-gray-900 dark:text-white">{catName}</span>
                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                    {catItems.length}
                  </span>
                </div>
              </button>

              {expandedCategories.has(catName) && (
                <div className="overflow-x-auto border-t border-gray-200 dark:border-gray-700">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                      <tr>
                        {['Item', 'Company', 'Qty', 'Status', 'Cost', 'Actions'].map(h => (
                          <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {catItems.map(item => (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</div>
                            {item.description && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                                {item.description}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <Building2 className="h-3.5 w-3.5" />
                              {item.companies?.company_name || (
                                <span className="text-gray-400 italic">No Company</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white font-medium">{item.quantity}</div>
                            <div className="text-xs text-gray-500">{item.group_number}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              item.available
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                            }`}>
                              {item.available ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {item.cost_per_unit_display || '-'}
                            </div>
                            <div className="text-xs text-gray-500">
                              Total: {item.total_cost_display || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => openAddModal(item)}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingItem ? 'Edit Inventory Item' : 'New Inventory Item'}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Item Name *
                  </label>
                  <input
                    type="text" required
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Select Company
                  </label>
                  <select
                    value={formData.companyId}
                    onChange={e => setFormData(prev => ({ ...prev, companyId: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Personal Inventory (No Company)</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.company_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Category *
                  </label>
                  <input
                    type="text" required
                    placeholder="e.g. Electronics"
                    value={formData.category}
                    onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={e => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Cost per Unit ($)
                  </label>
                  <input
                    type="number" step="0.01"
                    value={formData.costPerUnit}
                    onChange={e => setFormData(prev => ({ ...prev, costPerUnit: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Group ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SKU-123"
                    value={formData.groupNumber}
                    onChange={e => setFormData(prev => ({ ...prev, groupNumber: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox" id="modal-available"
                  checked={formData.available}
                  onChange={e => setFormData(prev => ({ ...prev, available: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="modal-available" className="text-sm text-gray-700 dark:text-gray-300">
                  Mark as available for stock
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
                >
                  {saving ? 'Saving...' : editingItem ? 'Update Item' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
