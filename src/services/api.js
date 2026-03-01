import axios from "axios";

// Base URL — points to Laravel backend
const BASE_URL =
  process.env.REACT_APP_API_URL ||
  "https://phplaravel-780646-6246811.cloudwaysapps.com/api";

// Create axios instance
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available (for admin routes)
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — handles 401 auto-logout
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      const message = data?.message || data?.error || error.message;
      switch (status) {
        case 401:
          // Clear all auth data and redirect to login
          localStorage.removeItem("authToken");
          localStorage.removeItem("adminUser");
          localStorage.removeItem("tokenExpiry");
          sessionStorage.removeItem("authToken");
          sessionStorage.removeItem("adminUser");
          window.location.href = "/admin/login";
          break;
        case 404:
          console.warn(`Resource not found: ${error.config?.url}`, message);
          break;
        case 500:
          console.error(`Server error: ${error.config?.url}`, message);
          break;
        default:
          console.warn(`API error (${status}): ${error.config?.url}`, message);
          break;
      }
    } else if (error.code === "ECONNABORTED") {
      console.error("Request timeout:", error.config?.url);
    } else if (!error.response) {
      console.error("Network error:", error.message);
    }
    return Promise.reject(error);
  },
);

// Helper: normalize list response (handles both array and paginated object responses)
const normalizeListResponse = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data; // Laravel paginated response
  if (data && Array.isArray(data.items)) return data.items;
  return [];
};

// === Property Service ===
export const propertyService = {
  getAll: async (params = {}) => {
    const response = await apiClient.get("/properties", { params });
    return normalizeListResponse(response.data);
  },

  getById: async (id) => {
    const response = await apiClient.get(`/properties/${id}`);
    return response.data;
  },

  getBySlug: async (slug) => {
    const response = await apiClient.get(`/properties/slug/${slug}`);
    const data = response.data;
    // Handle both wrapped { data: {...} } and direct object responses
    return data?.data || data || null;
  },

  getFeatured: async () => {
    const response = await apiClient.get("/properties", {
      params: { featured: true, isActive: true },
    });
    return normalizeListResponse(response.data);
  },

  getByStatus: async (status, params = {}) => {
    const response = await apiClient.get("/properties", {
      params: { status, isActive: true, ...params },
    });
    return normalizeListResponse(response.data);
  },

  getByType: async (type, params = {}) => {
    const response = await apiClient.get("/properties", {
      params: { type, isActive: true, ...params },
    });
    return normalizeListResponse(response.data);
  },

  search: async (query, params = {}) => {
    const response = await apiClient.get("/properties", {
      params: { q: query, isActive: true, ...params },
    });
    return normalizeListResponse(response.data);
  },

  create: async (data) => {
    const response = await apiClient.post("/admin/properties", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`/admin/properties/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/admin/properties/${id}`);
    return response.data;
  },
};

// === Lead Service ===
export const leadService = {
  getAll: async (params = {}) => {
    const response = await apiClient.get("/admin/leads", { params });
    return normalizeListResponse(response.data);
  },

  getById: async (id) => {
    const response = await apiClient.get(`/admin/leads/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post("/leads", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`/admin/leads/${id}`, data);
    return response.data;
  },

  addNote: async (id, noteText) => {
    const response = await apiClient.post(`/admin/leads/${id}/notes`, {
      text: noteText,
    });
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/admin/leads/${id}`);
    return response.data;
  },
};

// === Neighborhood Service ===
export const neighborhoodService = {
  getAll: async (params = {}) => {
    const response = await apiClient.get("/neighborhoods", { params });
    return normalizeListResponse(response.data);
  },

  getById: async (id) => {
    const response = await apiClient.get(`/neighborhoods/${id}`);
    return response.data;
  },

  getActive: async () => {
    const response = await apiClient.get("/neighborhoods/active");
    return normalizeListResponse(response.data);
  },

  create: async (data) => {
    const response = await apiClient.post("/neighborhoods", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`/neighborhoods/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/neighborhoods/${id}`);
    return response.data;
  },
};

// === Partner Service ===
export const partnerService = {
  getAll: async (params = {}) => {
    const response = await apiClient.get("/partners", { params });
    return normalizeListResponse(response.data);
  },

  getById: async (id) => {
    const response = await apiClient.get(`/partners/${id}`);
    return response.data;
  },

  getActive: async () => {
    const response = await apiClient.get("/partners/active");
    return normalizeListResponse(response.data);
  },

  create: async (data) => {
    const response = await apiClient.post("/partners", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`/partners/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/partners/${id}`);
    return response.data;
  },
};

// === FAQ Service ===
export const faqService = {
  getAll: async (params = {}) => {
    const response = await apiClient.get("/faqs", { params });
    const data = normalizeListResponse(response.data);
    return data.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  },

  getById: async (id) => {
    const response = await apiClient.get(`/faqs/${id}`);
    return response.data;
  },

  getByCategory: async (category) => {
    const response = await apiClient.get("/faqs", {
      params: { category, isActive: true },
    });
    const data = normalizeListResponse(response.data);
    return data.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  },

  create: async (data) => {
    const response = await apiClient.post("/faqs", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`/faqs/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/faqs/${id}`);
    return response.data;
  },
};

// === Article Service ===
export const articleService = {
  getAll: async (params = {}) => {
    const response = await apiClient.get("/articles", { params });
    return normalizeListResponse(response.data);
  },

  getById: async (id) => {
    const response = await apiClient.get(`/articles/${id}`);
    return response.data;
  },

  getBySlug: async (slug) => {
    const response = await apiClient.get(`/articles/slug/${slug}`);
    const data = response.data;
    // Handle both wrapped { data: {...} } and direct object responses
    return data?.data || data || null;
  },

  getTrending: async () => {
    const response = await apiClient.get("/articles/trending");
    return normalizeListResponse(response.data);
  },

  getByIds: async (ids) => {
    if (!ids || ids.length === 0) return [];
    // Fetch each article individually and combine
    const results = await Promise.allSettled(
      ids.map((id) => apiClient.get(`/articles/${id}`)),
    );
    return results
      .filter((r) => r.status === "fulfilled")
      .map((r) => r.value.data);
  },

  getByCategory: async (category, params = {}) => {
    const response = await apiClient.get("/articles", {
      params: { category, isActive: true, ...params },
    });
    return normalizeListResponse(response.data);
  },

  create: async (data) => {
    const response = await apiClient.post("/admin/articles", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`/admin/articles/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/admin/articles/${id}`);
    return response.data;
  },
};

// === Site Settings Service ===
export const siteSettingsService = {
  get: async () => {
    const response = await apiClient.get("/settings");
    return response.data;
  },

  update: async (data) => {
    const response = await apiClient.put("/admin/settings", data);
    return response.data;
  },
};

// === Auth Service (Laravel) ===
export const authService = {
  login: async (email, password) => {
    const response = await apiClient.post("/auth/login", { email, password });
    const data = response.data;

    // Laravel returns: { token, user, tokenExpiry? }
    const token = data.token;
    const userData = data.user || data;
    const tokenExpiry =
      data.tokenExpiry ||
      data.token_expiry ||
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const safeUser = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      avatar: userData.avatar || null,
    };

    return { user: safeUser, token, tokenExpiry };
  },

  getProfile: async () => {
    const response = await apiClient.get("/auth/profile");
    return response.data;
  },

  logout: async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // Silently fail — we still want to clear local state
    }
    localStorage.removeItem("authToken");
    localStorage.removeItem("adminUser");
    localStorage.removeItem("tokenExpiry");
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("adminUser");
  },
};

// === Admin User Management Service ===
export const adminService = {
  getAll: async (params = {}) => {
    const response = await apiClient.get("/admin/users", { params });
    return normalizeListResponse(response.data);
  },

  getById: async (id) => {
    const response = await apiClient.get(`/admin/users/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post("/admin/users", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`/admin/users/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/admin/users/${id}`);
    return response.data;
  },
};

// === User Management Service (Admin Panel) ===
export const userService = {
  getAll: async (params = {}) => {
    const response = await apiClient.get("/admin/users", { params });
    return normalizeListResponse(response.data);
  },

  getById: async (id) => {
    const response = await apiClient.get(`/admin/users/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post("/admin/users", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`/admin/users/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/admin/users/${id}`);
    return response.data;
  },
};

// === Dashboard Service ===
export const dashboardService = {
  get: async () => {
    const response = await apiClient.get("/dashboard");
    return response.data;
  },
};

// === Visit Tracking Service ===
export const visitService = {
  record: async (data = {}) => {
    try {
      const response = await apiClient.post("/visits", data);
      return response.data;
    } catch {
      // Silently fail — visit tracking should never block UX
    }
  },
};

// === Newsletter Service ===
export const newsletterService = {
  subscribe: async (email) => {
    const response = await apiClient.post("/newsletter/subscribe", { email });
    return response.data;
  },
};

export default apiClient;
