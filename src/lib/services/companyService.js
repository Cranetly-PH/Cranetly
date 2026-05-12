import { supabase } from '../supabase';

export const companyService = {
  async getCompanies(ownerId) {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getCompany(companyId) {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();
    if (error) throw error;
    return data;
  },

  async createCompany(companyData) {
    const { data, error } = await supabase
      .from('companies')
      .insert({
        owner_id: companyData.ownerId,
        company_name: companyData.companyName,
        company_logo: companyData.companyLogo || '',
        business_type: companyData.businessType || '',
        business_email: companyData.businessEmail || '',
        phone_number: companyData.phoneNumber || '',
        address: companyData.address || '',
        description: companyData.description || '',
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating company:', error);
      throw new Error(error.message || 'Failed to create company.');
    }
    return data;
  },

  async updateCompany(companyId, updates) {
    const { data, error } = await supabase
      .from('companies')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', companyId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating company:', error);
      throw new Error(error.message || 'Failed to update company.');
    }
    return data;
  },

  async deleteCompany(companyId) {
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', companyId);
    if (error) throw error;
  }
};
