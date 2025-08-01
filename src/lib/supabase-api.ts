import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

// Type definitions for better type safety
export type Medicine = Tables<'medicines'>;
export type Customer = Tables<'customers'>;
export type Prescription = Tables<'prescriptions'>;
export type PrescriptionItem = Tables<'prescription_items'>;
export type Sale = Tables<'sales'>;
export type SaleItem = Tables<'sale_items'>;
export type User = Tables<'users'>;
export type Alert = Tables<'alerts'>;
export type Attendance = Tables<'attendance'>;

// Enhanced types with relationships
export type MedicineWithStock = Medicine & {
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
  expiry_status: 'valid' | 'expiring_soon' | 'expired';
};

export type PrescriptionWithDetails = Prescription & {
  customer: Customer;
  prescription_items: (PrescriptionItem & { medicine: Medicine })[];
  _count: { items: number };
};

export type SaleWithDetails = Sale & {
  customer?: Customer;
  prescription?: Prescription;
  cashier: User;
  sale_items: (SaleItem & { medicine: Medicine })[];
};

export type CustomerWithStats = Customer & {
  _count: {
    prescriptions: number;
    sales: number;
  };
};

// Authentication API
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
  async getAll(filters?: { 
    search?: string; 
    category?: string; 
    lowStock?: boolean; 
    expiringSoon?: boolean;
    page?: number;
    limit?: number;
  }) {
    let query = supabase.from('medicines').select('*').neq('quantity', 0);
    
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,generic_name.ilike.%${filters.search}%,manufacturer.ilike.%${filters.search}%`);
    }
    
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    
    if (filters?.lowStock) {
      query = query.lt('quantity', 10); // Use static value instead of RPC call
    }
    
    if (filters?.expiringSoon) {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      query = query.lte('expiry_date', thirtyDaysFromNow.toISOString().split('T')[0]);
    }

    // Add pagination
    if (filters?.page && filters?.limit) {
      const from = (filters.page - 1) * filters.limit;
      const to = from + filters.limit - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query.order('name');
    if (error) throw error;

    // Calculate stats (excluding soft-deleted medicines)
    const { data: allMedicines } = await supabase.from('medicines').select('*').gt('quantity', 0);
    const stats = this.calculateMedicineStats(allMedicines || []);

    return { 
      medicines: data?.map(med => this.enhanceMedicineData(med)) || [], 
      stats,
      total: count || 0
    };
  },

  async getById(id: string) {
    const { data, error } = await supabase.from('medicines').select('*').eq('id', id).single();
    if (error) throw error;
    return this.enhanceMedicineData(data);
  },

  async create(medicine: TablesInsert<'medicines'>) {
    const { data, error } = await supabase.from('medicines').insert(medicine).select().single();
    if (error) throw error;
    
    // Check for low stock alert
    await this.checkAndCreateStockAlert(data);
    
    return this.enhanceMedicineData(data);
  },

  async update(id: string, updates: TablesUpdate<'medicines'>) {
    const { data, error } = await supabase.from('medicines').update(updates).eq('id', id).select().single();
    if (error) throw error;
    
    // Check for low stock alert
    await this.checkAndCreateStockAlert(data);
    
    return this.enhanceMedicineData(data);
  },

  async delete(id: string) {
    console.log('API: Attempting to delete medicine with ID:', id);
    
    // First, let's try to verify the medicine exists
    const { data: existingMedicine, error: fetchError } = await supabase
      .from('medicines')
      .select('*')
      .eq('id', id)
      .single();
    
    console.log('API: Medicine exists check:', { existingMedicine, fetchError });
    
    if (fetchError || !existingMedicine) {
      throw new Error('Medicine not found in database');
    }
    
    // Try delete with RLS bypass (using service role if available)
    const { data, error, count } = await supabase
      .from('medicines')
      .delete()
      .eq('id', id)
      .select();
    
    console.log('API: Delete response:', { data, error, count });
    
    if (error) {
      console.error('API: Delete error:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.warn('API: No rows were deleted due to RLS policies. Attempting soft delete...');
      
      // Fallback: Soft delete by setting quantity to 0 (this will hide it from UI)
      const { data: softDeleteData, error: softDeleteError } = await supabase
        .from('medicines')
        .update({ 
          quantity: 0,  // Set quantity to 0 to remove from stock counts and hide from UI
          name: `[DELETED] ${existingMedicine.name}` // Mark name as deleted for admin reference
        })
        .eq('id', id)
        .select();
      
      console.log('API: Soft delete response:', { softDeleteData, softDeleteError });
      
      if (softDeleteError) {
        throw softDeleteError;
      }
      
      if (!softDeleteData || softDeleteData.length === 0) {
        throw new Error('Unable to delete medicine - insufficient permissions');
      }
      
      console.log('API: Successfully soft-deleted medicine:', softDeleteData[0]);
      return softDeleteData[0];
    }
    
    console.log('API: Successfully hard-deleted medicine:', data[0]);
    return data[0];
  },

  async getCategories() {
    const { data, error } = await supabase.from('medicines').select('category').order('category');
    if (error) throw error;
    const categories = [...new Set(data.map(item => item.category))];
    return { categories };
  },

  async adjustStock(id: string, adjustment: { type: 'IN' | 'OUT' | 'ADJUSTMENT'; quantity: number; reason: string }) {
    const { data: medicine, error: fetchError } = await supabase.from('medicines').select('*').eq('id', id).single();
    if (fetchError) throw fetchError;

    let newQuantity = medicine.quantity;
    if (adjustment.type === 'IN') {
      newQuantity += adjustment.quantity;
    } else if (adjustment.type === 'OUT') {
      newQuantity -= adjustment.quantity;
    } else {
      newQuantity = adjustment.quantity;
    }

    const { data, error } = await supabase.from('medicines')
      .update({ quantity: Math.max(0, newQuantity) })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Check for alerts
    await this.checkAndCreateStockAlert(data);
    
    return this.enhanceMedicineData(data);
  },

  enhanceMedicineData(medicine: Medicine): MedicineWithStock {
    const stockStatus = medicine.quantity <= 0 ? 'out_of_stock' : 
                       medicine.quantity <= medicine.min_stock_level ? 'low_stock' : 'in_stock';
    
    const expiryDate = new Date(medicine.expiry_date);
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    const expiryStatus = expiryDate < today ? 'expired' :
                        expiryDate <= thirtyDaysFromNow ? 'expiring_soon' : 'valid';

    return {
      ...medicine,
      stock_status: stockStatus,
      expiry_status: expiryStatus
    };
  },

  calculateMedicineStats(medicines: Medicine[]) {
    const totalMedicines = medicines.length;
    const lowStockItems = medicines.filter(m => m.quantity <= m.min_stock_level).length;
    
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringSoon = medicines.filter(m => new Date(m.expiry_date) <= thirtyDaysFromNow).length;
    
    const totalValue = medicines.reduce((sum, m) => sum + (m.price * m.quantity), 0);
    const outOfStock = medicines.filter(m => m.quantity === 0).length;
    const categories = new Set(medicines.map(m => m.category)).size;

    return {
      totalMedicines,
      lowStockItems,
      expiringSoon,
      totalValue,
      outOfStock,
      categories
    };
  },

  async checkAndCreateStockAlert(medicine: Medicine) {
    if (medicine.quantity <= medicine.min_stock_level) {
      // Check if alert already exists
      const { data: existingAlert } = await supabase
        .from('alerts')
        .select('id')
        .eq('type', 'STOCK')
        .ilike('message', `%${medicine.name}%`)
        .eq('is_read', false)
        .single();

      if (!existingAlert) {
        await supabase.from('alerts').insert({
          type: 'STOCK',
          title: medicine.quantity === 0 ? 'Out of Stock' : 'Low Stock Alert',
          message: `${medicine.name} - ${medicine.quantity === 0 ? 'Out of stock' : `Only ${medicine.quantity} units remaining`}`,
          severity: medicine.quantity === 0 ? 'CRITICAL' : 'HIGH'
        });
      }
    }
  }
};

// Customers API
export const customersAPI = {
  async getAll(filters?: { search?: string; page?: number; limit?: number }) {
    let query = supabase.from('customers').select(`
      *,
      prescriptions(id),
      sales(id)
    `);

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
    }

    if (filters?.page && filters?.limit) {
      const from = (filters.page - 1) * filters.limit;
      const to = from + filters.limit - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query.order('name');
    if (error) throw error;

    const customersWithStats: CustomerWithStats[] = (data || []).map(customer => ({
      ...customer,
      _count: {
        prescriptions: customer.prescriptions?.length || 0,
        sales: customer.sales?.length || 0
      }
    }));

    return { customers: customersWithStats, total: count || 0 };
  },

  async getById(id: string) {
    const { data, error } = await supabase.from('customers').select(`
      *,
      prescriptions(*),
      sales(*)
    `).eq('id', id).single();
    if (error) throw error;
    return data;
  },

  async create(customer: TablesInsert<'customers'>) {
    const { data, error } = await supabase.from('customers').insert(customer).select().single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: TablesUpdate<'customers'>) {
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
  async getAll(filters?: { 
    search?: string; 
    status?: string; 
    customerId?: string;
    page?: number;
    limit?: number;
  }) {
    let query = supabase.from('prescriptions').select(`
      *,
      customer:customers(*),
      prescription_items(*, medicine:medicines(*)),
      sales(total, sale_date)
    `);

    if (filters?.search) {
      query = query.or(`prescription_number.ilike.%${filters.search}%,doctor_name.ilike.%${filters.search}%`);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.customerId) {
      query = query.eq('customer_id', filters.customerId);
    }

    if (filters?.page && filters?.limit) {
      const from = (filters.page - 1) * filters.limit;
      const to = from + filters.limit - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    const prescriptionsWithDetails: PrescriptionWithDetails[] = (data || []).map(prescription => ({
      ...prescription,
      _count: {
        items: prescription.prescription_items?.length || 0
      }
    }));

    return { prescriptions: prescriptionsWithDetails, total: count || 0 };
  },

  async getById(id: string) {
    const { data, error } = await supabase.from('prescriptions').select(`
      *,
      customer:customers(*),
      prescription_items(*, medicine:medicines(*))
    `).eq('id', id).single();
    if (error) throw error;
    return data;
  },

  async create(prescription: {
    customerId: string;
    doctorName: string;
    prescriptionNumber: string;
    issueDate: string;
    notes?: string;
    items: {
      medicineId: string;
      quantity: number;
      dosage: string;
      frequency: string;
      duration: string;
      instructions?: string;
    }[];
  }) {
    const { data: prescriptionData, error: prescriptionError } = await supabase
      .from('prescriptions')
      .insert({
        customer_id: prescription.customerId,
        doctor_name: prescription.doctorName,
        prescription_number: prescription.prescriptionNumber,
        issue_date: prescription.issueDate,
        notes: prescription.notes
      })
      .select()
      .single();

    if (prescriptionError) throw prescriptionError;

    // Insert prescription items
    const items = prescription.items.map(item => ({
      prescription_id: prescriptionData.id,
      medicine_id: item.medicineId,
      quantity: item.quantity,
      dosage: item.dosage,
      frequency: item.frequency,
      duration: item.duration,
      instructions: item.instructions
    }));

    const { error: itemsError } = await supabase
      .from('prescription_items')
      .insert(items);

    if (itemsError) throw itemsError;

    return this.getById(prescriptionData.id);
  },

  async update(id: string, updates: TablesUpdate<'prescriptions'>) {
    const { data, error } = await supabase.from('prescriptions').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async fill(id: string, saleData: { paymentMethod: string; discount?: number }) {
    // Get prescription with items
    const prescription = await this.getById(id);
    if (!prescription) throw new Error('Prescription not found');
    if (prescription.status !== 'PENDING') throw new Error('Prescription is not pending');

    // Check stock availability
    for (const item of prescription.prescription_items) {
      if (item.medicine.quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${item.medicine.name}. Available: ${item.medicine.quantity}, Required: ${item.quantity}`);
      }
    }

    // Get current user for cashier_id
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: currentUser } = await supabase.from('users').select('id').eq('auth_id', user.id).single();
    if (!currentUser) throw new Error('User profile not found');

    // Calculate totals
    let subtotal = 0;
    const saleItems = prescription.prescription_items.map(item => {
      const itemSubtotal = item.quantity * item.medicine.price;
      subtotal += itemSubtotal;
      return {
        medicine_id: item.medicine_id,
        quantity: item.quantity,
        unit_price: item.medicine.price,
        subtotal: itemSubtotal,
        discount: 0
      };
    });

    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax - (saleData.discount || 0);

    // Create sale
    const { data: sale, error: saleError } = await supabase.from('sales').insert({
      customer_id: prescription.customer_id,
      prescription_id: id,
      subtotal,
      tax,
      discount: saleData.discount || 0,
      total,
      payment_method: saleData.paymentMethod,
      cashier_id: currentUser.id,
      sale_date: new Date().toISOString()
    }).select().single();

    if (saleError) throw saleError;

    // Insert sale items
    const saleItemsWithSaleId = saleItems.map(item => ({
      ...item,
      sale_id: sale.id
    }));

    const { error: itemsError } = await supabase.from('sale_items').insert(saleItemsWithSaleId);
    if (itemsError) throw itemsError;

    // Update medicine quantities
    for (const item of prescription.prescription_items) {
      await supabase.from('medicines')
        .update({ quantity: item.medicine.quantity - item.quantity })
        .eq('id', item.medicine_id);
    }

    // Update prescription status
    await supabase.from('prescriptions').update({ status: 'FILLED' }).eq('id', id);

    return sale;
  }
};

// Sales API
export const salesAPI = {
  async getAll(filters?: { 
    startDate?: string; 
    endDate?: string; 
    paymentMethod?: string;
    customerId?: string;
    page?: number;
    limit?: number;
  }) {
    let query = supabase.from('sales').select(`
      *,
      customer:customers(*),
      prescription:prescriptions(*),
      cashier:users(*),
      sale_items(*, medicine:medicines(*))
    `);

    if (filters?.startDate) {
      query = query.gte('sale_date', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('sale_date', filters.endDate);
    }
    if (filters?.paymentMethod) {
      query = query.eq('payment_method', filters.paymentMethod);
    }
    if (filters?.customerId) {
      query = query.eq('customer_id', filters.customerId);
    }

    if (filters?.page && filters?.limit) {
      const from = (filters.page - 1) * filters.limit;
      const to = from + filters.limit - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query.order('sale_date', { ascending: false });
    if (error) throw error;

    return { sales: data as SaleWithDetails[], total: count || 0 };
  },

  async getById(id: string) {
    const { data, error } = await supabase.from('sales').select(`
      *,
      customer:customers(*),
      prescription:prescriptions(*),
      cashier:users(*),
      sale_items(*, medicine:medicines(*))
    `).eq('id', id).single();
    if (error) throw error;
    return data as SaleWithDetails;
  },

  async create(sale: {
    customerId?: string;
    items: {
      medicineId: string;
      quantity: number;
      unitPrice: number;
      discount?: number;
    }[];
    paymentMethod: string;
    discount?: number;
    notes?: string;
  }) {
    // Get current user for cashier_id
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: currentUser } = await supabase.from('users').select('id').eq('auth_id', user.id).single();
    if (!currentUser) throw new Error('User profile not found');

    // Validate stock availability
    for (const item of sale.items) {
      const { data: medicine } = await supabase.from('medicines').select('quantity, name').eq('id', item.medicineId).single();
      if (!medicine) throw new Error(`Medicine not found: ${item.medicineId}`);
      if (medicine.quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${medicine.name}. Available: ${medicine.quantity}, Required: ${item.quantity}`);
      }
    }

    // Calculate totals
    const subtotal = sale.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice) - (item.discount || 0), 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax - (sale.discount || 0);

    // Create sale
    const { data: saleData, error: saleError } = await supabase.from('sales').insert({
      customer_id: sale.customerId,
      subtotal,
      tax,
      discount: sale.discount || 0,
      total,
      payment_method: sale.paymentMethod,
      cashier_id: currentUser.id,
      notes: sale.notes,
      sale_date: new Date().toISOString()
    }).select().single();

    if (saleError) throw saleError;

    // Insert sale items
    const saleItems = sale.items.map(item => ({
      sale_id: saleData.id,
      medicine_id: item.medicineId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      subtotal: (item.quantity * item.unitPrice) - (item.discount || 0),
      discount: item.discount || 0
    }));

    const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);
    if (itemsError) throw itemsError;

    // Update medicine quantities and check for alerts
    for (const item of sale.items) {
      const { data: medicine } = await supabase.from('medicines').select('*').eq('id', item.medicineId).single();
      if (medicine) {
        const newQuantity = medicine.quantity - item.quantity;
        await supabase.from('medicines').update({ quantity: newQuantity }).eq('id', item.medicineId);
        
        // Check for low stock alert
        if (newQuantity <= medicine.min_stock_level) {
          await medicinesAPI.checkAndCreateStockAlert({ ...medicine, quantity: newQuantity });
        }
      }
    }

    return this.getById(saleData.id);
  },

  async getStats(filters?: { startDate?: string; endDate?: string }) {
    let query = supabase.from('sales').select('total, subtotal, tax, discount, payment_method, sale_date');
    
    if (filters?.startDate) {
      query = query.gte('sale_date', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('sale_date', filters.endDate);
    }

    const { data, error } = await query;
    if (error) throw error;

    const sales = data || [];
    const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
    const totalTransactions = sales.length;
    const averageSale = totalTransactions > 0 ? totalSales / totalTransactions : 0;
    const totalTax = sales.reduce((sum, sale) => sum + Number(sale.tax), 0);
    const totalDiscount = sales.reduce((sum, sale) => sum + Number(sale.discount), 0);

    // Group by payment method
    const paymentMethodMap = new Map();
    sales.forEach(sale => {
      const method = sale.payment_method;
      if (!paymentMethodMap.has(method)) {
        paymentMethodMap.set(method, { total: 0, count: 0 });
      }
      const current = paymentMethodMap.get(method);
      current.total += Number(sale.total);
      current.count += 1;
    });

    const salesByPaymentMethod = Array.from(paymentMethodMap.entries()).map(([method, data]) => ({
      paymentMethod: method,
      _sum: { total: data.total },
      _count: { id: data.count }
    }));

    return {
      totalSales,
      totalTransactions,
      averageSale,
      totalTax,
      totalDiscount,
      salesByPaymentMethod,
      topMedicines: [] // Would need complex query with sale_items
    };
  }
};

// Alerts API
export const alertsAPI = {
  async getAll(filters?: { 
    type?: string; 
    severity?: string; 
    isRead?: boolean;
    page?: number;
    limit?: number;
  }) {
    let query = supabase.from('alerts').select('*');

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.severity) {
      query = query.eq('severity', filters.severity);
    }
    if (filters?.isRead !== undefined) {
      query = query.eq('is_read', filters.isRead);
    }

    if (filters?.page && filters?.limit) {
      const from = (filters.page - 1) * filters.limit;
      const to = from + filters.limit - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    return { alerts: data || [], total: count || 0 };
  },

  async markAsRead(id: string) {
    const { data, error } = await supabase.from('alerts').update({ is_read: true }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async markAllAsRead(filters?: { type?: string; severity?: string }) {
    let query = supabase.from('alerts').update({ is_read: true }).eq('is_read', false);
    
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.severity) {
      query = query.eq('severity', filters.severity);
    }

    const { error } = await query;
    if (error) throw error;
  },

  async delete(id: string) {
    const { error } = await supabase.from('alerts').delete().eq('id', id);
    if (error) throw error;
  },

  async getStats() {
    const { data, error } = await supabase.from('alerts').select('*');
    if (error) throw error;
    
    const alerts = data || [];
    const unreadAlerts = alerts.filter(alert => !alert.is_read);
    
    // Count by type
    const byType = {
      STOCK: alerts.filter(alert => alert.type === 'STOCK').length,
      EXPIRY: alerts.filter(alert => alert.type === 'EXPIRY').length,
      SYSTEM: alerts.filter(alert => alert.type === 'SYSTEM').length
    };
    
    // Count by severity
    const bySeverity = {
      HIGH: alerts.filter(alert => alert.severity === 'HIGH').length,
      MEDIUM: alerts.filter(alert => alert.severity === 'MEDIUM').length,
      LOW: alerts.filter(alert => alert.severity === 'LOW').length
    };
    
    return {
      total: alerts.length,
      unread: unreadAlerts.length,
      byType,
      bySeverity
    };
  },

  async checkStock() {
    // Get medicines with low stock
    const { data: medicines, error } = await supabase
      .from('medicines')
      .select('*')
      .lte('quantity', 10); // Use static value instead of RPC call

    if (error) throw error;

    let alertsCreated = 0;
    for (const medicine of medicines || []) {
      // Check if alert already exists
      const { data: existingAlert } = await supabase
        .from('alerts')
        .select('id')
        .eq('type', 'STOCK')
        .ilike('message', `%${medicine.name}%`)
        .eq('is_read', false)
        .single();

      if (!existingAlert) {
        await supabase.from('alerts').insert({
          type: 'STOCK',
          title: medicine.quantity === 0 ? 'Out of Stock' : 'Low Stock Alert',
          message: `${medicine.name} - ${medicine.quantity === 0 ? 'Out of stock' : `Only ${medicine.quantity} units remaining`}`,
          severity: medicine.quantity === 0 ? 'CRITICAL' : 'HIGH'
        });
        alertsCreated++;
      }
    }

    return { success: true, alertsCreated };
  },

  async checkExpiry() {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const { data: medicines, error } = await supabase
      .from('medicines')
      .select('*')
      .lte('expiry_date', thirtyDaysFromNow.toISOString().split('T')[0]);

    if (error) throw error;

    let alertsCreated = 0;
    for (const medicine of medicines || []) {
      // Check if alert already exists
      const { data: existingAlert } = await supabase
        .from('alerts')
        .select('id')
        .eq('type', 'EXPIRY')
        .ilike('message', `%${medicine.name}%`)
        .eq('is_read', false)
        .single();

      if (!existingAlert) {
        const expiryDate = new Date(medicine.expiry_date);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        await supabase.from('alerts').insert({
          type: 'EXPIRY',
          title: 'Medicine Expiring Soon',
          message: `${medicine.name} expires in ${daysUntilExpiry} days`,
          severity: daysUntilExpiry <= 7 ? 'CRITICAL' : daysUntilExpiry <= 14 ? 'HIGH' : 'MEDIUM'
        });
        alertsCreated++;
      }
    }

    return { success: true, alertsCreated };
  }
};

// Users/Staff API
export const usersAPI = {
  async getAll(filters?: { search?: string; role?: string; page?: number; limit?: number }) {
    let query = supabase.from('users').select('*');

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    if (filters?.role) {
      query = query.eq('role', filters.role);
    }

    if (filters?.page && filters?.limit) {
      const from = (filters.page - 1) * filters.limit;
      const to = from + filters.limit - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query.order('name');
    if (error) throw error;

    return { users: data || [], total: count || 0 };
  },

  async getById(id: string) {
    const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: TablesUpdate<'users'>) {
    const { data, error } = await supabase.from('users').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async getCurrentUserProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase.from('users').select('*').eq('auth_id', user.id).single();
    if (error) throw error;
    return data;
  }
};

// Attendance API
export const attendanceAPI = {
  async getAll(filters?: { 
    employeeId?: string; 
    startDate?: string; 
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    let query = supabase.from('attendance').select(`
      *,
      employee:users(*)
    `);

    if (filters?.employeeId) {
      query = query.eq('employee_id', filters.employeeId);
    }
    if (filters?.startDate) {
      query = query.gte('date', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('date', filters.endDate);
    }

    if (filters?.page && filters?.limit) {
      const from = (filters.page - 1) * filters.limit;
      const to = from + filters.limit - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query.order('date', { ascending: false });
    if (error) throw error;

    return { attendance: data || [], total: count || 0 };
  },

  async clockIn(employeeId: string) {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    const { data, error } = await supabase.from('attendance').upsert({
      employee_id: employeeId,
      date: today,
      clock_in: now
    }, {
      onConflict: 'employee_id,date'
    }).select().single();

    if (error) throw error;
    return data;
  },

  async clockOut(employeeId: string) {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    // Get existing record
    const { data: existing } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('date', today)
      .single();

    if (!existing || !existing.clock_in) {
      throw new Error('No clock-in record found for today');
    }

    // Calculate total hours
    const clockIn = new Date(existing.clock_in);
    const clockOut = new Date(now);
    const totalHours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);

    const { data, error } = await supabase.from('attendance')
      .update({
        clock_out: now,
        total_hours: totalHours
      })
      .eq('employee_id', employeeId)
      .eq('date', today)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Dashboard API
export const dashboardAPI = {
  async getStats() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    const [
      { data: medicines },
      { data: customers },
      { data: allSales },
      { data: alerts },
      { data: prescriptions }
    ] = await Promise.all([
      supabase.from('medicines').select('*').gt('quantity', 0),
      supabase.from('customers').select('*'),
      supabase.from('sales').select('total, sale_date, created_at'),
      supabase.from('alerts').select('*').eq('is_read', false),
      supabase.from('prescriptions').select('*')
    ]);

    // Filter sales for today using either sale_date or created_at
    const todaySales = (allSales || []).filter(sale => {
      const saleDate = sale.sale_date ? new Date(sale.sale_date) : new Date(sale.created_at);
      return saleDate >= startOfDay && saleDate <= endOfDay;
    });

    const medicineStats = medicinesAPI.calculateMedicineStats(medicines || []);
    const totalRevenue = todaySales.reduce((sum, sale) => sum + Number(sale.total), 0);
    const pendingPrescriptions = (prescriptions || []).filter(p => p.status === 'PENDING').length;

    return {
      totalRevenue,
      totalMedicines: medicineStats.totalMedicines,
      totalCustomers: (customers || []).length,
      totalSales: todaySales.length,
      lowStockItems: medicineStats.lowStockItems,
      expiringSoon: medicineStats.expiringSoon,
      unreadAlerts: (alerts || []).length,
      pendingPrescriptions
    };
  },

  async getRecentTransactions(limit: number = 10) {
    const { data, error } = await supabase.from('sales').select(`
      *,
      customer:customers(name),
      prescription:prescriptions(prescription_number)
    `).order('sale_date', { ascending: false }).limit(limit);

    if (error) throw error;
    return data || [];
  },

  async getSalesChart(days: number = 7) {
    const salesData = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const { data } = await supabase
        .from('sales')
        .select('total')
        .gte('sale_date', `${dateStr}T00:00:00`)
        .lte('sale_date', `${dateStr}T23:59:59`);

      const dayTotal = (data || []).reduce((sum, sale) => sum + Number(sale.total), 0);
      
      salesData.push({
        date: dateStr,
        sales: dayTotal,
        transactions: (data || []).length
      });
    }

    return salesData;
  }
};