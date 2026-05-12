import { supabase } from '../supabase';

export const feedService = {
  async getFeed({ limit = 20, offset = 0, signal } = {}) {
    console.log(`[feedService] Fetching feed: limit=${limit}, offset=${offset}`);
    
    // Fetch products and requests in parallel with limits
    let productsQuery = supabase
      .from('products')
      .select(`
        *,
        profiles (full_name, company_name, avatar_url)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    let requestsQuery = supabase
      .from('requests')
      .select(`
        *,
        profiles (full_name, company_name, avatar_url)
      `)
      .order('created_at', { ascending: false });

    // Apply range if we are paginating
    // Note: For combined feeds, simple range on both can miss items or show duplicates
    // but for now we'll stick to a slightly larger range to ensure we have enough to sort
    productsQuery = productsQuery.range(offset, offset + limit - 1);
    requestsQuery = requestsQuery.range(offset, offset + limit - 1);

    if (signal) {
      productsQuery = productsQuery.abortSignal(signal);
      requestsQuery = requestsQuery.abortSignal(signal);
    }

    try {
      const [productsRes, requestsRes] = await Promise.all([
        productsQuery,
        requestsQuery,
      ]);

      if (productsRes.error) {
        if (productsRes.error.message?.includes('AbortError')) throw productsRes.error;
        console.error('[feedService] products error:', productsRes.error);
        throw productsRes.error;
      }
      if (requestsRes.error) {
        if (requestsRes.error.message?.includes('AbortError')) throw requestsRes.error;
        console.error('[feedService] requests error:', requestsRes.error);
        throw requestsRes.error;
      }

      const products = productsRes.data || [];
      const requests = requestsRes.data || [];
      
      console.log(`[feedService] Retrieved ${products.length} products and ${requests.length} requests`);

      const productPosts = products.map(p => ({
        id: p.id,
        type: p.listing_type || 'product',
        productName: p.name,
        supplierName: p.profiles?.full_name || p.profiles?.company_name || 'Anonymous Supplier',
        companyName: p.profiles?.company_name || '',
        price: p.price_display || (p.price ? `$${p.price}` : 'Contact for price'),
        location: p.location || '',
        postedAt: new Date(p.created_at),
        image: p.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop',
        category: p.category || 'General',
        description: p.description || '',
        userId: p.user_id,
      }));

      const requestPosts = requests.map(r => ({
        id: r.id,
        type: 'request',
        productName: r.product_name,
        businessName: r.profiles?.full_name || r.profiles?.company_name || 'Anonymous Business',
        budget: r.budget_display || (r.budget ? `$${r.budget}` : 'Budget not specified'),
        quantity: r.quantity || 0,
        location: r.location || '',
        postedAt: new Date(r.created_at),
        image: 'https://images.unsplash.com/photo-1487017159836-4e23ece2e4cf?w=400&h=300&fit=crop',
        category: 'Request',
        deadline: r.deadline || '',
        description: r.description || '',
        userId: r.user_id,
      }));

      // Combine and sort, then limit again to return the correct number of items
      const combined = [...productPosts, ...requestPosts]
        .sort((a, b) => b.postedAt - a.postedAt)
        .slice(0, limit);
        
      console.log(`[feedService] Returning ${combined.length} combined posts`);
      return combined;
    } catch (err) {
      if (err.name === 'AbortError' || err.message?.includes('AbortError')) {
        console.log('[feedService] Fetch aborted');
        return [];
      }
      throw err;
    }
  }
};
