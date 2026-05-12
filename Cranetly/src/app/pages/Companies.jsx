import { useState, useEffect } from 'react';
import { Plus, Building2, MapPin, Mail, Phone, Globe, Trash2, Edit2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { companyService } from '../../lib/api';

function CompanyModal({ isOpen, onClose, onSaved, company = null }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    companyName: '',
    businessType: '',
    businessEmail: '',
    phoneNumber: '',
    address: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (company) {
      setFormData({
        companyName: company.company_name,
        businessType: company.business_type || '',
        businessEmail: company.business_email || '',
        phoneNumber: company.phone_number || '',
        address: company.address || '',
        description: company.description || '',
      });
    } else {
      setFormData({
        companyName: '',
        businessType: '',
        businessEmail: '',
        phoneNumber: '',
        address: '',
        description: '',
      });
    }
  }, [company, isOpen]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (company) {
        await companyService.updateCompany(company.id, formData);
      } else {
        await companyService.createCompany({ ...formData, ownerId: user.id });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save company.');
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl text-gray-900 dark:text-white">
            {company ? 'Edit Company' : 'Register New Company'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Company Name *</label>
            <input
              type="text"
              required
              value={formData.companyName}
              onChange={e => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Business Type</label>
              <input
                type="text"
                placeholder="e.g. Retail, Manufacturing"
                value={formData.businessType}
                onChange={e => setFormData(prev => ({ ...prev, businessType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Business Email</label>
              <input
                type="email"
                value={formData.businessEmail}
                onChange={e => setFormData(prev => ({ ...prev, businessEmail: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
            <input
              type="text"
              value={formData.phoneNumber}
              onChange={e => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : (company ? 'Update Company' : 'Register Company')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Companies() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);

  useEffect(() => {
    if (user) loadCompanies();
  }, [user]);

  async function loadCompanies() {
    setLoading(true);
    try {
      const data = await companyService.getCompanies(user.id);
      setCompanies(data);
    } catch (err) {
      console.error('Failed to load companies:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this company? This will also delete all associated inventory.')) return;
    try {
      await companyService.deleteCompany(id);
      setCompanies(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      alert('Failed to delete company.');
    }
  }

  function handleEdit(company) {
    setEditingCompany(company);
    setModalOpen(true);
  }

  function handleAddNew() {
    setEditingCompany(null);
    setModalOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl text-gray-900 dark:text-white font-semibold">My Companies</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage your business entities and their information
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Company
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 animate-pulse border border-gray-100 dark:border-gray-700">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : companies.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-dashed border-gray-300 dark:border-gray-700">
          <Building2 className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No companies registered</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
            Get started by registering your first company to manage inventory and listings.
          </p>
          <button
            onClick={handleAddNew}
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Register My First Company
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {companies.map(company => (
            <div
              key={company.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <Building2 className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{company.company_name}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${
                        company.verification_status === 'verified' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
                      }`}>
                        {company.verification_status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(company)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(company.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 mt-6">
                  {company.business_type && (
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <Globe className="h-4 w-4" />
                      <span>{company.business_type}</span>
                    </div>
                  )}
                  {company.business_email && (
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <Mail className="h-4 w-4" />
                      <span>{company.business_email}</span>
                    </div>
                  )}
                  {company.phone_number && (
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <Phone className="h-4 w-4" />
                      <span>{company.phone_number}</span>
                    </div>
                  )}
                  {company.address && (
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="h-4 w-4" />
                      <span>{company.address}</span>
                    </div>
                  )}
                </div>

                {company.description && (
                  <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 italic">
                      "{company.description}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <CompanyModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={loadCompanies}
        company={editingCompany}
      />
    </div>
  );
}
