import { useState, useEffect, useCallback, useRef } from 'react';
import { DollarSign, Package, Send, AlertCircle, Clock, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getRequests, createOffer } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { timeAgo } from '../utils/timeAgo';

function SubmitOfferModal({ isOpen, request, onClose, onSubmitted }) {
  const [formData, setFormData] = useState({ price: '', description: '', deliveryTime: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSubmitted({ ...formData, requestId: request.id });
      setFormData({ price: '', description: '', deliveryTime: '' });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit offer.');
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen || !request) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl text-gray-900 dark:text-white">Submit Offer</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            For: <span className="text-gray-900 dark:text-white">{request.product_name}</span>
          </p>
          {request.budget_display && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Budget: <span className="text-green-600">{request.budget_display}</span>
            </p>
          )}
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>
          )}
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Your Price ($) *</label>
            <input
              type="number" step="0.01" required
              value={formData.price}
              onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your price"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe what you're offering..."
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Delivery Time</label>
            <input
              type="text"
              value={formData.deliveryTime}
              onChange={e => setFormData(prev => ({ ...prev, deliveryTime: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. 5-7 business days"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="h-4 w-4" />
              {saving ? 'Submitting...' : 'Submit Offer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function SupplierDashboard() {
  const { user } = useAuth();

  // ─── CRITICAL FIX: isMounted owned by single empty-dep effect ─────────────
  const isMounted = useRef(false);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);
  // ──────────────────────────────────────────────────────────────────────────

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [error, setError] = useState('');
  const [submittedOffers, setSubmittedOffers] = useState(new Set());

  const loadRequests = useCallback(async (options = {}) => {
    const { signal, silent = false } = options;

    // ── Stale-while-revalidate ──────────────────────────────────────────────
    // Only show skeleton on first load. Realtime updates refresh silently so
    // existing request cards stay visible.
    if (!silent) {
      setRequests(prev => {
        if (prev.length === 0) setLoading(true);
        return prev;
      });
    }
    setError('');

    try {
      const data = await getRequests({
        statuses: ['pending', 'in-progress'],
        signal,
      });
      if (isMounted.current) setRequests(data);
    } catch (err) {
      if (err?.name !== 'AbortError' && isMounted.current) {
        setError('Failed to load requests.');
        console.error('[SupplierDashboard] loadRequests error:', err);
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, []); // stable — no external deps

  // Initial fetch
  useEffect(() => {
    const controller = new AbortController();
    loadRequests({ signal: controller.signal });
    return () => controller.abort();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime subscription — mount-only, unique channel ID prevents HMR leaks
  useEffect(() => {
    const channelId = `supplier_dash_rt_${Date.now()}`;

    const handleChange = () => {
      if (isMounted.current) loadRequests({ silent: true });
    };

    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, handleChange)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSubmitOffer(request) {
    setSelectedRequest(request);
    setShowOfferModal(true);
  }

  async function handleOfferSubmitted(offerData) {
    const offer = await createOffer(user.id, offerData);
    setSubmittedOffers(prev => new Set([...prev, offerData.requestId]));
    return offer;
  }

  const stats = [
    { label: 'Offers Submitted', value: submittedOffers.size, icon: Send,       color: 'text-blue-600'   },
    { label: 'Open Requests',    value: requests.length,       icon: Package,    color: 'text-green-600'  },
    { label: 'Your Account',     value: user?.type === 'supplier' ? 'Supplier' : 'Other', icon: DollarSign, color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900 dark:text-white">Supplier Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          View business requests and submit offers
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
              <div>
                <p className="text-2xl text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Open Requests */}
      <div>
        <h2 className="text-lg text-gray-900 dark:text-white mb-4">Open Business Requests</h2>
        {loading && requests.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
              </div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <Package className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No open requests at the moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map(request => {
              const businessName = request.profiles?.full_name || request.profiles?.company_name || 'Business';
              const alreadyOffered = submittedOffers.has(request.id);
              return (
                <div key={request.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm">
                          {businessName.charAt(0)}
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{businessName}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg text-gray-900 dark:text-white">{request.product_name}</h3>
                        {request.category && (
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-[10px] rounded uppercase font-medium">
                            {request.category}
                          </span>
                        )}
                      </div>
                      {request.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{request.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleSubmitOffer(request)}
                      disabled={alreadyOffered}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 ml-4"
                    >
                      <Send className="h-4 w-4" />
                      {alreadyOffered ? 'Offer Sent ✓' : 'Submit Offer'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Quantity</p>
                      <p className="text-gray-900 dark:text-white">
                        {request.quantity ? `${request.quantity} units` : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Budget</p>
                      <p className="text-green-600">
                        {request.budget_display || (request.budget ? `$${request.budget}` : '—')}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Deadline</p>
                      <p className="text-gray-900 dark:text-white">{request.deadline || '—'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Offers</p>
                      <p className="text-gray-900 dark:text-white">{request.offers_count || 0}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                    {request.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{request.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{timeAgo(new Date(request.created_at))}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <SubmitOfferModal
        isOpen={showOfferModal}
        request={selectedRequest}
        onClose={() => setShowOfferModal(false)}
        onSubmitted={handleOfferSubmitted}
      />
    </div>
  );
}
