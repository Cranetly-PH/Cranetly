import { supabase } from '../supabase';

export const productService = {
  async getProducts({ search = '', category = 'all', sortBy = 'recent', limit = 20, offset = 0, signal } = {}) {
    let query = supabase
      .from('products')
      .select(`
        *,
        profiles (full_name, company_name, avatar_url)
      `)
      .eq('is_active', true);

    if (signal) {
      query = query.abortSignal(signal);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,category.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (category && category !== 'all') {
      query = query.ilike('category', `%${category}%`);
    }

    switch (sortBy) {
      case 'price-low':
        query = query.order('price', { ascending: true });
        break;
      case 'price-high':
        query = query.order('price', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query.range(offset, offset + limit - 1);
    if (error) {
      if (error.message?.includes('AbortError')) throw error;
      throw error;
    }
    return data || [];
  },

  async getUserProducts(userId, signal) {
    let query = supabase
      .from('products')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (signal) {
      query = query.abortSignal(signal);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async createProduct(userId, productData) {
    const priceValue = parseFloat(productData.price);
    const isValidPrice = !isNaN(priceValue);

    const { data, error } = await supabase
      .from('products')
      .insert({
        user_id: userId,
        name: productData.productName,
        category: productData.category,
        price: isValidPrice ? priceValue : null,
        price_display: isValidPrice ? `$${priceValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Contact for price',
        location: productData.location || '',
        contact_number: productData.contactNumber || '',
        description: productData.description || '',
        image_url: productData.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop',
        listing_type: productData.listingType || 'product',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      throw new Error(error.message || 'Failed to create product listing.');
    }
    return data;
  },

  async updateProduct(productId, updates) {
    const { data, error } = await supabase
      .from('products')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', productId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteProduct(productId) {
    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', productId);
    if (error) throw error;
  }
};
