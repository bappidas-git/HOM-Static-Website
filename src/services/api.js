import axios from 'axios';

// Base URL — change this to Laravel backend URL when ready
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Create axios instance
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available (for admin routes)
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          localStorage.removeItem('authToken');
          window.location.href = '/admin/login';
          break;
        case 404:
          break;
        case 500:
          break;
        default:
          break;
      }
    }
    return Promise.reject(error);
  }
);

// === Property Service ===
export const propertyService = {
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/properties', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await apiClient.get(`/properties/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getBySlug: async (slug) => {
    try {
      const response = await apiClient.get('/properties', {
        params: { slug },
      });
      return response.data[0] || null;
    } catch (error) {
      throw error;
    }
  },

  getFeatured: async () => {
    try {
      const response = await apiClient.get('/properties', {
        params: { tags_like: 'featured', isActive: true },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getByStatus: async (status, params = {}) => {
    try {
      const response = await apiClient.get('/properties', {
        params: { status, isActive: true, ...params },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getByType: async (type, params = {}) => {
    try {
      const response = await apiClient.get('/properties', {
        params: { type, isActive: true, ...params },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  search: async (query, params = {}) => {
    try {
      const response = await apiClient.get('/properties', {
        params: { q: query, isActive: true, ...params },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  create: async (data) => {
    try {
      const response = await apiClient.post('/properties', {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const response = await apiClient.patch(`/properties/${id}`, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await apiClient.delete(`/properties/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// === Lead Service ===
export const leadService = {
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/leads', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await apiClient.get(`/leads/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  create: async (data) => {
    try {
      const response = await apiClient.post('/leads', {
        ...data,
        status: 'new',
        notes: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const response = await apiClient.patch(`/leads/${id}`, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  addNote: async (id, noteText) => {
    try {
      const lead = await leadService.getById(id);
      const updatedNotes = [
        ...lead.notes,
        { text: noteText, addedAt: new Date().toISOString() },
      ];
      return leadService.update(id, { notes: updatedNotes });
    } catch (error) {
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await apiClient.delete(`/leads/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// === Neighborhood Service ===
export const neighborhoodService = {
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/neighborhoods', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await apiClient.get(`/neighborhoods/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getActive: async () => {
    try {
      const response = await apiClient.get('/neighborhoods', {
        params: { isActive: true },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  create: async (data) => {
    try {
      const response = await apiClient.post('/neighborhoods', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const response = await apiClient.patch(`/neighborhoods/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await apiClient.delete(`/neighborhoods/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// === Partner Service ===
export const partnerService = {
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/partners', {
        params: { _sort: 'order', _order: 'asc', ...params },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await apiClient.get(`/partners/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getActive: async () => {
    try {
      const response = await apiClient.get('/partners', {
        params: { isActive: true, _sort: 'order', _order: 'asc' },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  create: async (data) => {
    try {
      const response = await apiClient.post('/partners', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const response = await apiClient.patch(`/partners/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await apiClient.delete(`/partners/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// === FAQ Service ===
export const faqService = {
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/faqs', {
        params: { _sort: 'order', _order: 'asc', ...params },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await apiClient.get(`/faqs/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getByCategory: async (category) => {
    try {
      const response = await apiClient.get('/faqs', {
        params: { category, isActive: true, _sort: 'order', _order: 'asc' },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  create: async (data) => {
    try {
      const response = await apiClient.post('/faqs', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const response = await apiClient.patch(`/faqs/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await apiClient.delete(`/faqs/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// === Article Service ===
export const articleService = {
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/articles', {
        params: { _sort: 'publishedAt', _order: 'desc', ...params },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await apiClient.get(`/articles/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getBySlug: async (slug) => {
    try {
      const response = await apiClient.get('/articles', {
        params: { slug },
      });
      return response.data[0] || null;
    } catch (error) {
      throw error;
    }
  },

  getByCategory: async (category, params = {}) => {
    try {
      const response = await apiClient.get('/articles', {
        params: { category, isActive: true, ...params },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  create: async (data) => {
    try {
      const response = await apiClient.post('/articles', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const response = await apiClient.patch(`/articles/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await apiClient.delete(`/articles/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// === Site Settings Service ===
export const siteSettingsService = {
  get: async () => {
    try {
      const response = await apiClient.get('/siteSettings');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  update: async (data) => {
    try {
      const response = await apiClient.patch('/siteSettings', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// === Admin Service ===
export const adminService = {
  login: async (email, password) => {
    try {
      // In JSON Server mode, we simulate auth by finding the user
      const response = await apiClient.get('/adminUsers', {
        params: { email },
      });
      const user = response.data[0];
      if (user) {
        // In real backend, password verification happens server-side
        return { user: { id: user.id, name: user.name, email: user.email, role: user.role }, token: 'mock-jwt-token' };
      }
      throw new Error('Invalid credentials');
    } catch (error) {
      throw error;
    }
  },

  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/adminUsers', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await apiClient.get(`/adminUsers/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  create: async (data) => {
    try {
      const response = await apiClient.post('/adminUsers', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const response = await apiClient.patch(`/adminUsers/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await apiClient.delete(`/adminUsers/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default apiClient;
