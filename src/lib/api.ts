const API_BASE_URL = 'http://localhost:3001/api';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

// API client with auth headers
const apiClient = {
  get: async (endpoint: string) => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  },

  post: async (endpoint: string, data: any) => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  },

  put: async (endpoint: string, data: any) => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  },

  delete: async (endpoint: string) => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    if (response.status === 204) {
      return null;
    }
    
    return response.json();
  },
};

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      throw new Error(`Login failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Store token in localStorage
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};

// Medicines API
export const medicinesAPI = {
  getAll: (params?: {
    search?: string;
    category?: string;
    lowStock?: boolean;
    expiringSoon?: boolean;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.category) searchParams.append('category', params.category);
    if (params?.lowStock) searchParams.append('lowStock', 'true');
    if (params?.expiringSoon) searchParams.append('expiringSoon', 'true');
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    
    const queryString = searchParams.toString();
    return apiClient.get(`/medicines${queryString ? `?${queryString}` : ''}`);
  },

  getById: (id: string) => apiClient.get(`/medicines/${id}`),

  create: (data: any) => apiClient.post('/medicines', data),

  update: (id: string, data: any) => apiClient.put(`/medicines/${id}`, data),

  delete: (id: string) => apiClient.delete(`/medicines/${id}`),

  getCategories: () => apiClient.get('/medicines/meta/categories'),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => apiClient.get('/dashboard/stats'),
  getRecentTransactions: () => apiClient.get('/dashboard/recent-transactions'),
  getSalesChart: (days?: number) => {
    const params = days ? `?days=${days}` : '';
    return apiClient.get(`/dashboard/sales-chart${params}`);
  },
};

// Customers API
export const customersAPI = {
  getAll: (params?: { search?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    
    const queryString = searchParams.toString();
    return apiClient.get(`/customers${queryString ? `?${queryString}` : ''}`);
  },

  getById: (id: string) => apiClient.get(`/customers/${id}`),

  create: (data: any) => apiClient.post('/customers', data),

  update: (id: string, data: any) => apiClient.put(`/customers/${id}`, data),

  delete: (id: string) => apiClient.delete(`/customers/${id}`),
};

// Prescriptions API
export const prescriptionsAPI = {
  getAll: (params?: { 
    status?: string; 
    search?: string; 
    page?: number; 
    limit?: number 
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    
    const queryString = searchParams.toString();
    return apiClient.get(`/prescriptions${queryString ? `?${queryString}` : ''}`);
  },

  getById: (id: string) => apiClient.get(`/prescriptions/${id}`),

  create: (data: any) => apiClient.post('/prescriptions', data),

  update: (id: string, data: unknown) => apiClient.put(`/prescriptions/${id}`, data),

  fill: (id: string, data: { paymentMethod?: string; discount?: number }) => 
    apiClient.post(`/prescriptions/${id}/fill`, data),
};

// Sales API
export const salesAPI = {
  getAll: (params?: { 
    startDate?: string;
    endDate?: string;
    paymentMethod?: string;
    customerId?: string;
    page?: number; 
    limit?: number 
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    if (params?.paymentMethod) searchParams.append('paymentMethod', params.paymentMethod);
    if (params?.customerId) searchParams.append('customerId', params.customerId);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    
    const queryString = searchParams.toString();
    return apiClient.get(`/sales${queryString ? `?${queryString}` : ''}`);
  },

  getById: (id: string) => apiClient.get(`/sales/${id}`),

  create: (data: unknown) => apiClient.post('/sales', data),

  getStats: (params?: { startDate?: string; endDate?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    
    const queryString = searchParams.toString();
    return apiClient.get(`/sales/stats/summary${queryString ? `?${queryString}` : ''}`);
  },
};

// Alerts API
export const alertsAPI = {
  getAll: (params?: {
    type?: string;
    severity?: string;
    isRead?: boolean;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.append('type', params.type);
    if (params?.severity) searchParams.append('severity', params.severity);
    if (params?.isRead !== undefined) searchParams.append('isRead', params.isRead.toString());
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    
    const queryString = searchParams.toString();
    return apiClient.get(`/alerts${queryString ? `?${queryString}` : ''}`);
  },

  getStats: () => apiClient.get('/alerts/stats'),

  markAsRead: (id: string) => apiClient.put(`/alerts/${id}/read`, {}),

  markAllAsRead: (filters?: { type?: string; severity?: string }) => 
    apiClient.put('/alerts/read-all', filters || {}),

  delete: (id: string) => apiClient.delete(`/alerts/${id}`),

  checkStock: () => apiClient.post('/alerts/check-stock', {}),

  checkExpiry: () => apiClient.post('/alerts/check-expiry', {}),
};

export default apiClient;