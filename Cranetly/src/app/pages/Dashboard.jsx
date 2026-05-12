import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { MapPin, Clock, Building2, Phone, Map as MapIcon, Plus, SlidersHorizontal, Send, Package as PackageIcon } from 'lucide-react';
import { timeAgo } from '../utils/timeAgo';
import { ProductDetailsModal } from '../components/ProductDetailsModal';
import { MapViewModal } from '../components/MapViewModal';
import { CreateProductModal } from '../components/CreateProductModal';
import { CreateRequestModal } from '../components/CreateRequestModal';
import { FilterModal } from '../components/FilterModal';
import { getProducts, getRequests } from '../../lib/api';
import { supabase } from '../../lib/supabase';

export function Dashboard() {
  const { user } = useAuth();
  // ─── CRITICAL FIX #1 ──────────────────────────────────────────────────────
  // isMounted is owned by a single empty-dep effect. It must never be reset
  // inside a callback-dep effect or it will go false while still mounted.
  const isMounted = useRef(false);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);
  // ──────────────────────────────────────────────────────────────────────────

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery    = searchParams.get('search')   || '';
  const categoryFilter = searchParams.get('category') || 'all';
  const typeFilter     = searchParams.get('type')     || 'all';

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sortBy, setSortBy] = useState('recent');
  const [showMap, setShowMap] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const fetchListings = useCallback(async (signal) => {
    // ─── CRITICAL FIX #2 – Stale-while-revalidate ─────────────────────────
    // Do NOT call setListings([]) or setLoading(true) unconditionally here.
    // If we already have data, keep showing it while the new fetch runs so the
    // UI never flashes blank/skeleton during navigation-back or filter changes.
    // Only show the full skeleton on the very first load (listings is empty).
    setListings(prev => {
      if (prev.length === 0) setLoading(true);
      return prev; // keep existing data visible
    });
    // ──────────────────────────────────────────────────────────────────────
    setError(null);

    try {
      const promises = [];

      if (typeFilter === 'all' || typeFilter === 'product') {
        promises.push(
          getProducts({
            search: searchQuery,
            category: categoryFilter,
            sortBy,
            signal,
          }).then(data => data.map(l => ({ ...l, type: l.listing_type || 'product' })))
        );
      }

      if (typeFilter === 'all' || typeFilter === 'request') {
        promises.push(
          getRequests({
            search: searchQuery,
            category: categoryFilter,
            statuses: ['pending', 'in-progress'],
            signal,
          }).then(data => data.map(l => ({ ...l, type: 'request' })))
        );
      }

      const results = await Promise.all(promises);
      const combined = results.flat().sort((a, b) => {
        if (sortBy === 'price-low')  return (a.price || 0) - (b.price || 0);
        if (sortBy === 'price-high') return (b.price || 0) - (a.price || 0);
        return new Date(b.created_at) - new Date(a.created_at);
      });

      if (isMounted.current) setListings(combined);
    } catch (err) {
      if (err?.name !== 'AbortError' && isMounted.current) {
        console.error('[Dashboard] Failed to load listings:', err);
        setError('Failed to load marketplace listings.');
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [searchQuery, categoryFilter, typeFilter, sortBy]);

  // Fetch on filter/sort changes
  useEffect(() => {
    const controller = new AbortController();
    fetchListings(controller.signal);
    return () => controller.abort();
  }, [fetchListings]);

  // ─── CRITICAL FIX #3 – Realtime subscription for request/product visibility
  // Without this, a request posted by another user is never seen here unless
  // the page is manually refreshed. This effect is mount-only (empty deps) so
  // it never re-subscribes on filter/sort changes, preventing channel leaks.
  useEffect(() => {
    const channelId = `dashboard_rt_${Date.now()}`;

    const handleChange = () => {
      if (!isMounted.current) return;
      // Re-fetch silently — existing listings stay visible (stale-while-revalidate)
      const controller = new AbortController();
      fetchListings(controller.signal);
      // No cleanup needed for this inner controller; it's fire-and-forget
    };

    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'products' }, handleChange)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'requests' }, handleChange)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'requests' }, handleChange)
      .subscribe((status) => {
        console.debug('[Dashboard] Realtime channel:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const normalizedListings = listings.map(l => {
    const isRequest = l.type === 'request';
    return {
      id: l.id,
      type: l.type,
      productName:  isRequest ? l.product_name : l.name,
      supplierName: l.profiles?.full_name || 'Unknown',
      companyName:  l.profiles?.company_name || '',
      price: isRequest
        ? (l.budget_display || (l.budget ? `$${l.budget}` : 'Budget not specified'))
        : (l.price_display  || (l.price  ? `$${l.price}`  : 'Contact for price')),
      location:      l.location || '',
      postedAt:      new Date(l.created_at),
      image: isRequest
        ? 'https://images.unsplash.com/photo-1487017159836-4e23ece2e4cf?w=400&h=300&fit=crop'
        : (l.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop'),
      category:      l.category || (isRequest ? 'Request' : 'General'),
      contactNumber: l.contact_number,
      description:   l.description,
      userId:        l.user_id,
      quantity:      l.quantity,
    };
  });

  const handleOpenModal = () => {
    if (user?.type === 'business') setShowRequestModal(true);
    else setShowCreateModal(true);
  };

  // ─── CRITICAL FIX #4 – Retry uses a fresh AbortController ─────────────────
  // The old retry called fetchListings() with no signal, so the previous effect's
  // controller.abort() could cancel the retry. Now retry is self-contained.
  const handleRetry = useCallback(() => {
    const controller = new AbortController();
    fetchListings(controller.signal);
  }, [fetchListings]);
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl text-gray-900 dark:text-white font-bold">Marketplace</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {loading
              ? 'Loading…'
              : `${normalizedListings.length} ${normalizedListings.length === 1 ? 'listing' : 'listings'} available`}
            {searchQuery && ` for "${searchQuery}"`}
            {categoryFilter !== 'all' && ` in ${categoryFilter}`}
            {typeFilter !== 'all' && ` (${typeFilter}s)`}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setShowFilterModal(true)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </button>
          <button
            onClick={() => setShowMap(true)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
          >
            <MapIcon className="h-4 w-4" />
            Map
          </button>
          <button
            onClick={handleOpenModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Post
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 flex items-center justify-between">
          <p>{error}</p>
          <button
            onClick={handleRetry}
            className="px-3 py-1 bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-800/60 rounded text-sm transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Only show skeletons when there are NO listings yet (true initial load) */}
      {loading && normalizedListings.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200 dark:bg-gray-700" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : normalizedListings.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <p className="text-gray-500 dark:text-gray-400">No listings found matching your criteria.</p>
          <button
            onClick={handleOpenModal}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            Be the first to post!
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {normalizedListings.map(listing => (
            <div
              key={`${listing.type}-${listing.id}`}
              onClick={() => setSelectedProduct(listing)}
              className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden cursor-pointer"
            >
              <div className="h-48 overflow-hidden relative">
                <img
                  src={listing.image}
                  alt={listing.productName}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  onError={e => { e.target.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop'; }}
                />
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                    listing.type === 'request' ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'
                  }`}>
                    {listing.type}
                  </span>
                </div>
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <h3 className="text-lg text-gray-900 dark:text-white line-clamp-2 font-semibold">
                    {listing.productName}
                  </h3>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[10px] rounded uppercase font-medium">
                    {listing.category}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                    {listing.companyName?.charAt(0) || listing.supplierName.charAt(0)}
                  </div>
                  <p className="truncate">{listing.companyName || listing.supplierName}</p>
                </div>

                <div className="flex flex-col gap-1">
                  {listing.location && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <MapPin className="h-3 w-3" />
                      <span>{listing.location}</span>
                    </div>
                  )}
                  {listing.type === 'request' && listing.quantity && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <PackageIcon className="h-3 w-3" />
                      <span>{listing.quantity} units needed</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className={`text-xl font-bold ${listing.type === 'request' ? 'text-purple-600' : 'text-blue-600'}`}>
                    {listing.price}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>{timeAgo(listing.postedAt)}</span>
                  </div>
                </div>

                <button
                  onClick={e => { e.stopPropagation(); setSelectedProduct(listing); }}
                  className={`w-full py-2 px-4 rounded-md text-white transition-colors text-sm flex items-center justify-center gap-2 ${
                    listing.type === 'request' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {listing.type === 'request' ? <Send className="h-4 w-4" /> : <PackageIcon className="h-4 w-4" />}
                  {listing.type === 'request' ? 'Submit Offer' : 'View Details'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ProductDetailsModal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        product={selectedProduct}
      />

      <MapViewModal
        isOpen={showMap}
        onClose={() => setShowMap(false)}
        products={normalizedListings}
      />

      <CreateProductModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleRetry}
      />

      <CreateRequestModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onCreated={handleRetry}
      />

      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        selectedCategory={categoryFilter}
        onCategoryChange={cat => setSearchParams({ search: searchQuery, category: cat, type: typeFilter })}
        listingType={typeFilter}
        onTypeChange={type => setSearchParams({ search: searchQuery, category: categoryFilter, type })}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />
    </div>
  );
}
