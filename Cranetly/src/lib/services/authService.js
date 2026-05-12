import { supabase } from '../supabase';

export const authService = {
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  async ensureProfile(authUser) {
    console.log('[authService] ensureProfile started for:', authUser.id);
    let profile = await this.getProfile(authUser.id);
    
    if (!profile) {
      console.log('[authService] Profile missing, creating fallback row...');
      // Use upsert to be safe against race conditions
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: authUser.id,
          full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
          avatar_url: authUser.user_metadata?.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .select()
        .maybeSingle();
        
      if (error) {
        console.error('[authService] ensureProfile error:', error);
        throw error;
      }
      profile = data;
      console.log('[authService] Fallback profile created:', profile);
    } else {
      console.log('[authService] Profile already exists:', profile);
    }
    
    return profile;
  },

  async updateProfile(userId, updates) {
    console.log('[authService] updateProfile for:', userId, updates);
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .maybeSingle();
    
    if (error) {
      console.error('[authService] updateProfile error:', error);
      throw error;
    }
    
    if (!data) {
      console.warn('[authService] updateProfile returned no data, attempting upsert...');
      const { data: upserted, error: upsertError } = await supabase
        .from('profiles')
        .upsert({ id: userId, ...updates, updated_at: new Date().toISOString() })
        .select()
        .maybeSingle();
      if (upsertError) {
        console.error('[authService] upsert fallback error:', upsertError);
        throw upsertError;
      }
      return upserted;
    }
    
    console.log('[authService] updateProfile success:', data);
    return data;
  },

  async setAccountType(userId, accountType) {
    return this.updateProfile(userId, { account_type: accountType });
  },

  async uploadImage(file, bucket = 'products') {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (error) {
      console.error('Error uploading image:', error);
      throw new Error(error.message || 'Failed to upload image. Please check if the storage bucket exists and you have permission.');
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  }
};
