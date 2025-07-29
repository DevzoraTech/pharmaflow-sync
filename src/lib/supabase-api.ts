import { supabase } from '@/integrations/supabase/client';

// Authentication
export const authAPI = {
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  },

  async signup(email: string, password: string, userData: { name: string; role: string }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: userData
      }
    });
    if (error) throw error;
    return data;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }
};

// Medicines API
export const medicinesAPI = {
  async getAll(filters?: { search?: string; category?: string; lowStock?: boolean }) {
    let query = supabase.from('medicines').select('*');
    
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,generic_name.ilike.%${filters.search}%`);
    }
    
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    
    if (filters?.lowStock) {
      query = query.lt('quantity', supabase.from('medicines').select('min_stock_level'));
    }

    const { data, error } = await query.order('name');
    if (error) throw error;
    return { medicines: data };
  },

  async getById(id: string) {
    const { data, error } = await supabase.from('medicines').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  async create(medicine: any) {
    const { data, error } = await supabase.from('medicines').insert(medicine).select().single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: any) {
    const { data, error } = await supabase.from('medicines').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase.from('medicines').delete().eq('id', id);
    if (error) throw error;
  },

  async getCategories() {
    const { data, error } = await supabase.from('medicines').select('category').order('category');
    if (error) throw error;
    const categories = [...new Set(data.map(item => item.category))];
    return { categories };
  }
};

// Customers API
export const customersAPI = {
  async getAll() {
    const { data, error } = await supabase.from('customers').select('*').order('name');
    if (error) throw error;
    return { customers: data };
  },

  async getById(id: string) {
    const { data, error } = await supabase.from('customers').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  async create(customer: any) {
    const { data, error } = await supabase.from('customers').insert(customer).select().single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: any) {
    const { data, error } = await supabase.from('customers').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) throw error;
  }
};

// Prescriptions API
export const prescriptionsAPI = {
  async getAll() {
    const { data, error } = await supabase
      .from('prescriptions')
      .select(`
        *,
        customer:customers(*),
        prescription_items(*, medicine:medicines(*))
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { prescriptions: data };
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('prescriptions')
      .select(`
        *,
        customer:customers(*),
        prescription_items(*, medicine:medicines(*))
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(prescription: any) {
    const { data, error } = await supabase.from('prescriptions').insert(prescription).select().single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: any) {
    const { data, error } = await supabase.from('prescriptions').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }
};

// Sales API
export const salesAPI = {
  async getAll(filters?: { startDate?: string; endDate?: string }) {
    let query = supabase
      .from('sales')
      .select(`
        *,
        customer:customers(*),
        cashier:users(*),
        sale_items(*, medicine:medicines(*))
      `)
      .order('sale_date', { ascending: false });

    if (filters?.startDate) {
      query = query.gte('sale_date', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('sale_date', filters.endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { sales: data };
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        customer:customers(*),
        cashier:users(*),
        sale_items(*, medicine:medicines(*))
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(sale: any) {
    const { data, error } = await supabase.from('sales').insert(sale).select().single();
    if (error) throw error;
    return data;
  },

  async getStats(filters?: { startDate?: string; endDate?: string }) {
    let query = supabase.from('sales').select('total, subtotal, tax, discount, payment_method');
    
    if (filters?.startDate) {
      query = query.gte('sale_date', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('sale_date', filters.endDate);
    }

    const { data, error } = await query;
    if (error) throw error;

    const totalSales = data.reduce((sum, sale) => sum + Number(sale.total), 0);
    const totalTransactions = data.length;
    const averageSale = totalTransactions > 0 ? totalSales / totalTransactions : 0;
    const totalTax = data.reduce((sum, sale) => sum + Number(sale.tax), 0);
    const totalDiscount = data.reduce((sum, sale) => sum + Number(sale.discount), 0);

    return {
      totalSales,
      totalTransactions,
      averageSale,
      totalTax,
      totalDiscount,
      salesByPaymentMethod: [],
      topMedicines: []
    };
  }
};

// Alerts API
export const alertsAPI = {
  async getAll() {
    const { data, error } = await supabase.from('alerts').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return { alerts: data };
  },

  async markAsRead(id: string) {
    const { data, error } = await supabase.from('alerts').update({ is_read: true }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async markAllAsRead() {
    const { error } = await supabase.from('alerts').update({ is_read: true }).eq('is_read', false);
    if (error) throw error;
  },

  async delete(id: string) {
    const { error } = await supabase.from('alerts').delete().eq('id', id);
    if (error) throw error;
  },

  async getStats() {
    const { data, error } = await supabase.from('alerts').select('*').eq('is_read', false);
    if (error) throw error;
    return { unreadCount: data.length };
  },

  async checkStock() {
    // This would be implemented as needed - for now return empty
    return { success: true };
  },

  async checkExpiry() {
    // This would be implemented as needed - for now return empty
    return { success: true };
  }
};

// Dashboard API
export const dashboardAPI = {
  async getStats() {
    const [medicinesRes, customersRes, salesRes, alertsRes] = await Promise.all([
      supabase.from('medicines').select('*'),
      supabase.from('customers').select('*'),
      supabase.from('sales').select('total'),
      supabase.from('alerts').select('*').eq('is_read', false)
    ]);

    const medicines = medicinesRes.data || [];
    const customers = customersRes.data || [];
    const sales = salesRes.data || [];
    const alerts = alertsRes.data || [];

    const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
    const lowStockItems = medicines.filter(m => m.quantity <= m.min_stock_level).length;
    
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    const expiringSoon = medicines.filter(m => {
      const expiryDate = new Date(m.expiry_date);
      return expiryDate <= thirtyDaysFromNow;
    }).length;

    return {
      totalRevenue,
      totalMedicines: medicines.length,
      totalCustomers: customers.length,
      totalSales: sales.length,
      lowStockItems,
      expiringSoon,
      unreadAlerts: alerts.length
    };
  }
};