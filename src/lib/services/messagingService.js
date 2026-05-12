import { supabase } from '../supabase';

export const messagingService = {
  async getConversations(userId) {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        participant1:participant1_id (id, full_name:profiles!participant1_id(full_name), avatar_url:profiles!participant1_id(avatar_url)),
        participant2:participant2_id (id, full_name:profiles!participant2_id(full_name), avatar_url:profiles!participant2_id(avatar_url))
      `)
      .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
      .order('last_message_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getOrCreateConversation(userId, otherUserId, meta = {}) {
    // Try to find existing conversation
    const { data: existing } = await supabase
      .from('conversations')
      .select('*')
      .or(
        `and(participant1_id.eq.${userId},participant2_id.eq.${otherUserId}),and(participant1_id.eq.${otherUserId},participant2_id.eq.${userId})`
      )
      .maybeSingle();

    if (existing) return existing;

    // Create new conversation
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        participant1_id: userId,
        participant2_id: otherUserId,
        product_name: meta.productName || null,
        order_id: meta.orderId || null,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getMessages(conversationId) {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        profiles!sender_id (full_name, avatar_url)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async sendMessage(conversationId, senderId, content) {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async markMessagesRead(conversationId, userId) {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .eq('is_read', false);
    if (error) throw error;
  }
};
