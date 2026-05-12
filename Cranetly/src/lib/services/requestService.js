import { supabase } from '../supabase';

export const requestService = {
  async getRequests({ status, statuses, search = '', category = 'all', limit = 20, offset = 0, signal } = {}) {
    let query = supabase
      .from('requests')
      .select(`
        *,
        profiles!user_id (full_name, company_name, avatar_url)
      `)
      .order('created_at', { ascending: false });

    if (signal) {
      query = query.abortSignal(signal);
    }

    if (status) {
      query = query.eq('status', status);
    } else if (statuses && statuses.length > 0) {
      query = query.in('status', statuses);
    }

    if (search) {
      query = query.or(`product_name.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%`);
    }

    if (category && category !== 'all') {
      query = query.ilike('category', `%${category}%`);
    }

    const { data, error } = await query.range(offset, offset + limit - 1);
    if (error) throw error;
    return data || [];
  },

  async getUserRequests(userId, signal) {
    let query = supabase
      .from('requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (signal) {
      query = query.abortSignal(signal);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async createRequest(userId, requestData) {
    const budgetValue = parseFloat(requestData.budget);
    const isValidBudget = !isNaN(budgetValue);
    const quantityValue = parseInt(requestData.quantity);
    const isValidQuantity = !isNaN(quantityValue);

    const { data, error } = await supabase
      .from('requests')
      .insert({
        user_id: userId,
        product_name: requestData.productName,
        category: requestData.category,
        description: requestData.description || '',
        quantity: isValidQuantity ? quantityValue : null,
        budget: isValidBudget ? budgetValue : null,
        budget_display: isValidBudget ? `$${budgetValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Budget not specified',
        deadline: requestData.deadline || null,
        location: requestData.location || '',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating request:', error);
      throw new Error(error.message || 'Failed to create request.');
    }
    return data;
  },

  async updateRequestStatus(requestId, status) {
    const { data, error } = await supabase
      .from('requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .select()
      .single();
    if (error) {
      console.error('Error updating request status:', error);
      throw error;
    }
    return data;
  },

  async getOffersForRequest(requestId) {
    const { data, error } = await supabase
      .from('offers')
      .select(`
        *,
        profiles!supplier_id (full_name, company_name, avatar_url)
      `)
      .eq('request_id', requestId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async createOffer(supplierId, offerData) {
    const priceValue = parseFloat(offerData.price);
    if (isNaN(priceValue)) {
      throw new Error('Please enter a valid price for your offer.');
    }

    const { data, error } = await supabase
      .from('offers')
      .insert({
        request_id: offerData.requestId,
        supplier_id: supplierId,
        price: priceValue,
        description: offerData.description || '',
        delivery_time: offerData.deliveryTime || '',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating offer:', error);
      throw new Error(error.message || 'Failed to submit offer.');
    }
    return data;
  },

  async updateOfferStatus(offerId, status) {
    const { data, error } = await supabase
      .from('offers')
      .update({ status })
      .eq('id', offerId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};
