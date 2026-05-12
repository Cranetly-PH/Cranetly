import { supabase } from '../supabase';

export const orderService = {
  async getOrders(userId) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async createOrder(orderData) {
    const orderId = `ORD-${Date.now()}`;
    const totalPrice = parseFloat(orderData.totalPrice);
    const isValidPrice = !isNaN(totalPrice);

    const { data, error } = await supabase
      .from('orders')
      .insert({
        id: orderId,
        buyer_id: orderData.buyerId,
        seller_id: orderData.sellerId,
        product_id: orderData.productId || null,
        product_name: orderData.productName,
        quantity: parseInt(orderData.quantity) || 1,
        total_price: isValidPrice ? totalPrice : null,
        total_price_display: orderData.totalPriceDisplay || (isValidPrice ? `$${totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : null),
        customer_name: orderData.customerName,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating order:', error);
      throw new Error(error.message || 'Failed to create order.');
    }
    return data;
  },

  async updateOrderStatus(orderId, status) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('Error updating order status:', error);
      throw new Error(error.message || 'Failed to update order status.');
    }
    return data;
  }
};
