import { useState, useEffect, useCallback } from 'react';
import { Plus, Clock, CheckCircle, Package, AlertCircle, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserRequests, createRequest, updateRequestStatus } from '../../lib/api';
import { timeAgo } from '../utils/timeAgo';
import { CreateRequestModal } from '../components/CreateRequestModal';

export function BusinessDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState('');

  const loadRequests = useCallback(async (signal) => {
    setLoading(true);
    try {
      const data = await getUserRequests(user.id, signal);
      setRequests(data);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError('Failed to load requests.');
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    const controller = new AbortController();
    if (user) {
      loadRequests(controller.signal);
    }
    return () => controller.abort();
  }, [user?.id, loadRequests]);

  async function handleCreateRequest(formData) {
    const created = await createRequest(user.id, formData);
    setRequests(prev => [created, ...prev]);
    return created;
  }

  async function handleCancelRequest(requestId) {
    if (!window.confirm('Cancel this request?')) return;
    try {
      const updated = await updateRequestStatus(requestId, 'cancelled');
      setRequests(prev => prev.map(r => r.id === requestId ? updated : r));
    } catch (err) {
      setError('Failed to cancel request.');
    }
  }

  function getStatusColor(status) {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'in-progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  const stats = [
    { label: 'Active Requests', value: requests.filter(r => !['completed', 'cancelled'].includes(r.status)).length, icon: Package, color: 'text-blue-600' },
    { label: 'Total Offers', value: requests.reduce((sum, r) => sum + (r.offers_count || 0), 0), icon: CheckCircle, color: 'text-green-600' },
    { label: 'Completed', value: requests.filter(r => r.status === 'completed').length, icon: CheckCircle, color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl text-gray-900 dark:text-white">Business Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage your supply requests and procurement
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Post Request
        </button>
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

      {/* Requests */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No requests yet. Post your first supply request!</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            Post a Request
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(request => (
            <div key={request.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg text-gray-900 dark:text-white">{request.product_name}</h3>
                  {request.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{request.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${getStatusColor(request.status)}`}>
                    {request.status.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </span>
                  {request.status !== 'cancelled' && request.status !== 'completed' && (
                    <button
                      onClick={() => handleCancelRequest(request.id)}
                      className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      title="Cancel request"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Quantity</p>
                  <p className="text-gray-900 dark:text-white">{request.quantity || '—'} units</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Budget</p>
                  <p className="text-gray-900 dark:text-white">{request.budget_display || (request.budget ? `$${request.budget}` : '—')}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Deadline</p>
                  <p className="text-gray-900 dark:text-white">{request.deadline || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Offers</p>
                  <p className="text-blue-600">{request.offers_count || 0} offers</p>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <Clock className="h-3 w-3" />
                <span>Posted {timeAgo(new Date(request.created_at))}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateRequestModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleCreateRequest}
      />
    </div>
  );
}
