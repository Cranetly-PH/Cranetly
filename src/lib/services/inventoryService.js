import { supabase } from '../supabase';

export const inventoryService = {
  async getInventory(userId, companyId = null, signal) {
    let query = supabase
      .from('inventory')
      .select(`
        *,
        companies:company_id (company_name)
      `)
      .eq('user_id', userId);

    if (signal) {
      query = query.abortSignal(signal);
    }

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data, error } = await query
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createInventoryItem(userId, item) {
    const costPerUnit = parseFloat(item.costPerUnit);
    const quantity = parseInt(item.quantity);
    const isValidCost = !isNaN(costPerUnit);
    const isValidQty = !isNaN(quantity);
    const totalCost = isValidCost && isValidQty ? costPerUnit * quantity : 0;

    const { data, error } = await supabase
      .from('inventory')
      .insert({
        user_id: userId,
        company_id: item.companyId || null,
        name: item.name,
        description: item.description || '',
        group_number: item.groupNumber || '',
        group_name: item.groupName || '',
        quantity: isValidQty ? quantity : 0,
        available: item.available !== false,
        cost_per_unit: isValidCost ? costPerUnit : null,
        cost_per_unit_display: isValidCost ? `$${costPerUnit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : null,
        total_cost: totalCost || null,
        total_cost_display: totalCost ? `$${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : null,
        category: item.category,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating inventory item:', error);
      throw new Error(error.message || 'Failed to create inventory item.');
    }
    return data;
  },

  async updateInventoryItem(itemId, updates) {
    if (updates.costPerUnit || updates.quantity) {
      // Need to fetch current values if not provided to recalculate total
      // But for simplicity, we'll just recalculate if both are there
      const costPerUnit = parseFloat(updates.costPerUnit);
      const quantity = parseInt(updates.quantity);
      if (!isNaN(costPerUnit) && !isNaN(quantity)) {
        const totalCost = costPerUnit * quantity;
        updates.total_cost = totalCost;
        updates.total_cost_display = `$${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
    }
    const { data, error } = await supabase
      .from('inventory')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      console.error('Error updating inventory item:', error);
      throw new Error(error.message || 'Failed to update inventory item.');
    }
    return data;
  },

  async deleteInventoryItem(itemId) {
    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', itemId);
    if (error) throw error;
  }
};
