import { useNavigate } from 'react-router';
import { MapPin, Send, Package as PackageIcon, RefreshCw, ChevronDown } from 'lucide-react';
import { PostProductPrompt } from '../components/PostProductPrompt';
import { CreateProductModal } from '../components/CreateProductModal';
import { CreateRequestModal } from '../components/CreateRequestModal';
import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { timeAgo } from '../utils/timeAgo';
import { ProductDetailsModal } from '../components/ProductDetailsModal';
import { feedService } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { useToast } from '../context/ToastContext';

export function Home() {
  const { user } = useAuth();
  const toast = useToast();

  // ─── CRITICAL FIX #1 ────────────────────────────────────────────────────────
  // Store toast in a ref so loadFeed never has `toast` as a dependency.
  // Without this, every ToastContext re-render recreates loadFeed → triggers the
  // useEffect that holds isMounted + channels → cleanup sets isMounted=false
  // while still mounted → every async result is discarded → global loading storm.
  const toastRef = useRef(toast);
  useLayoutEffect(() => { toastRef.current = toast; });
  // ─────────────────────────────────────────────────────────────────────────────

  // ─── CRITICAL FIX #2 ────────────────────────────────────────────────────────
  // isMounted must only change on actual component mount/unmount, NOT on every
  // dependency change. A single empty-dep effect owns this ref exclusively.
  const isMounted = useRef(false);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []); // empty deps — runs ONLY on mount/unmount
  // ─────────────────────────────────────────────────────────────────────────────

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);   // true only on initial load (no data yet)
  const [refreshing, setRefreshing] = useState(false); // silent background refresh indicator
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const LIMIT = 10;

  // Ref-based post count avoids stale closure inside loadFeed without adding
  // posts.length to the callback deps (which would recreate the callback).
  const postsCountRef = useRef(0);
  useEffect(() => { postsCountRef.current = posts.length; }, [posts]);

  const handleOpenModal = () => {
    if (user?.type === 'business') setIsRequestModalOpen(true);
    else setIsCreateModalOpen(true);
  };

  // ─── CRITICAL FIX #3 ────────────────────────────────────────────────────────
  // loadFeed has NO external dependencies → completely stable reference.
  // All external values it needs are accessed through refs (toastRef, postsCountRef,
  // isMounted) so they are always current without causing recreations.
  const loadFeed = useCallback(async (options = {}) => {
    const { isMore = false, signal, silent = false } = options;

    if (isMore) {
      setLoadingMore(true);
    } else if (!silent && postsCountRef.current === 0) {
      // ── Stale-while-revalidate ──────────────────────────────────────────────
      // Only show the full skeleton when there is no existing data.
      // If posts are already displayed (navigation back, background refresh),
      // keep them visible and show a subtle refreshing indicator instead.
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setError(null);

    try {
      const offset = isMore ? postsCountRef.current : 0;
      const data = await feedService.getFeed({ limit: LIMIT, offset, signal });

      if (signal?.aborted) return;
      if (!isMounted.current) return;

      if (isMore) {
        setPosts(prev => [...prev, ...data]);
      } else {
        setPosts(data);
      }
      setHasMore(data.length === LIMIT);
    } catch (err) {
      if (err?.name === 'AbortError') return;
      if (!isMounted.current) return;

      console.error('[Home] Failed to load feed:', err);
      setError('Failed to load feed.');
      // Access toast via ref — no dependency created
      toastRef.current?.error?.('Failed to load feed. Please try again.');
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    }
  }, []); // ← STABLE: zero dependencies
  // ─────────────────────────────────────────────────────────────────────────────

  // ─── CRITICAL FIX #4 ────────────────────────────────────────────────────────
  // Split into TWO separate effects with empty deps so neither ever re-runs:
  //   Effect A: initial data fetch (abortable)
  //   Effect B: realtime subscription (unique channel name avoids HMR conflicts)
  //
  // Previously both lived in ONE effect keyed on [loadFeed]. Because loadFeed
  // depended on toast, any toast context update:
  //   • ran the cleanup → removed channels + set isMounted=false
  //   • re-ran the effect → re-fetched data + re-subscribed
  // This caused the global loading storm described in the bug report.
  // ─────────────────────────────────────────────────────────────────────────────

  // Effect A – initial fetch (mount only)
  useEffect(() => {
    const controller = new AbortController();
    loadFeed({ signal: controller.signal });
    return () => controller.abort();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Effect B – realtime subscription (mount only, unique ID prevents HMR leaks)
  useEffect(() => {
    // Unique channel name per component instance prevents accumulation of
    // stale subscriptions when HMR hot-reloads without full cleanup.
    const channelId = `home_rt_${Date.now()}`;

    const handleNewData = () => {
      if (!isMounted.current) return;
      // Silent refresh — existing posts remain visible (stale-while-revalidate)
      loadFeed({ silent: true });
    };

    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'products' }, handleNewData)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'requests' }, handleNewData)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.debug('[Home] Realtime channel subscribed:', channelId);
        }
      });

    return () => {
      console.debug('[Home] Removing realtime channel:', channelId);
      supabase.removeChannel(channel);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Manual refresh (called by button) — silent so existing posts stay visible
  const handleRefresh = useCallback(() => {
    loadFeed({ silent: true });
  }, [loadFeed]);

  function getPostTypeColor(type) {
    switch (type) {
      case 'product': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'supply':  return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'request': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default:        return 'bg-gray-100 text-gray-800';
    }
  }

  return (
    <div className="space-y-6">
      <PostProductPrompt onOpenModal={handleOpenModal} />

      <div>
        <div className="flex justify-between items-end mb-1">
          <h1 className="text-2xl text-gray-900 dark:text-white font-bold">Feed</h1>
          <button
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors disabled:opacity-50"
            title="Refresh feed"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Latest products, supplies, and requests from the community
          {refreshing && (
            <span className="ml-2 text-xs text-blue-500 animate-pulse">Updating…</span>
          )}
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PackageIcon className="h-5 w-5" />
            <p>{error}</p>
          </div>
          <button
            onClick={handleRefresh}
            className="px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-sm transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Only show full skeleton on true initial load (no data yet) */}
      {loading && posts.length === 0 ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="space-y-1">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                </div>
              </div>
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <div
              key={`${post.type}-${post.id}`}
              className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
                      {(post.type === 'request' ? post.businessName : post.supplierName)
                        ?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {post.type === 'request' ? post.businessName : post.supplierName}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {timeAgo(post.postedAt)}
                        </p>
                        <span className={`px-2 py-0.5 rounded text-xs ${getPostTypeColor(post.type)}`}>
                          {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <h3 className="text-lg text-gray-900 dark:text-white mb-1">{post.productName}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    {post.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{post.location}</span>
                      </div>
                    )}
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded">
                      {post.category}
                    </span>
                  </div>
                </div>

                <div
                  onClick={() => setSelectedProduct(post)}
                  className="mb-3 rounded-lg overflow-hidden cursor-pointer"
                >
                  <img
                    src={post.image}
                    alt={post.productName}
                    className="w-full h-64 object-cover hover:scale-105 transition-transform duration-300"
                    onError={e => { e.target.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop'; }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  {post.type === 'request' ? (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Budget</p>
                      <p className="text-xl text-purple-600">{post.budget}</p>
                      {post.quantity && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">Qty: {post.quantity} units</p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Price</p>
                      <p className="text-xl text-blue-600">{post.price}</p>
                    </div>
                  )}
                  <button
                    onClick={() => setSelectedProduct(post)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
                  >
                    {post.type === 'request' ? (
                      <><Send className="h-4 w-4" />Submit Offer</>
                    ) : (
                      <><PackageIcon className="h-4 w-4" />View Details</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {hasMore && (
            <div className="pt-4 flex justify-center">
              <button
                onClick={() => loadFeed({ isMore: true })}
                disabled={loadingMore}
                className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center gap-2 font-medium"
              >
                {loadingMore ? (
                  <><RefreshCw className="h-4 w-4 animate-spin" />Loading...</>
                ) : (
                  <>Load More<ChevronDown className="h-4 w-4" /></>
                )}
              </button>
            </div>
          )}

          {posts.length === 0 && !loading && (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
              <p className="text-gray-500 dark:text-gray-400">No posts yet. Be the first to post!</p>
              <button
                onClick={handleOpenModal}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                {user?.type === 'business' ? 'Post a Request' : 'Post a Product'}
              </button>
            </div>
          )}
        </div>
      )}

      <CreateProductModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleRefresh}
      />

      <CreateRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onCreated={handleRefresh}
      />

      <ProductDetailsModal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        product={selectedProduct}
      />
    </div>
  );
}
