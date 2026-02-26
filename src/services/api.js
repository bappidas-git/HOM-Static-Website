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
      const { status, data } = error.response;
      const message = data?.message || data?.error || error.message;
      switch (status) {
        case 401:
          localStorage.removeItem('authToken');
          window.location.href = '/admin/login';
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
    } else if (error.code === 'ECONNABORTED') {
      console.error('Request timeout:', error.config?.url);
    } else if (!error.response) {
      console.error('Network error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Helper: normalize list response (handles both array and paginated object responses)
const normalizeListResponse = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data; // Laravel paginated response
  if (data && Array.isArray(data.items)) return data.items;
  return [];
};

// json-server v1 does not reliably support ?q= for full-text search
// (see https://github.com/typicode/json-server/issues/1633).
// This helper filters results in the service layer as a workaround.
// When migrating to Laravel, remove this and use server-side search.
const filterByQuery = (items, query) => {
  if (!query || !query.trim()) return items;
  const q = query.trim().toLowerCase();
  return items.filter((p) => {
    const title = (p.title || '').toLowerCase();
    const area = (p.location?.area || '').toLowerCase();
    const city = (p.location?.city || '').toLowerCase();
    const developer = (p.developer || '').toLowerCase();
    return (
      title.includes(q) ||
      area.includes(q) ||
      city.includes(q) ||
      developer.includes(q)
    );
  });
};

// === Property Service ===
export const propertyService = {
  getAll: async (params = {}) => {
    try {
      // Extract q param — json-server v1 ignores it, so we filter client-side
      const { q, ...serverParams } = params;
      const response = await apiClient.get('/properties', { params: serverParams });
      const data = normalizeListResponse(response.data);
      return filterByQuery(data, q);
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
      // Handle both array (JSON Server) and single object (Laravel) responses
      const data = response.data;
      if (Array.isArray(data)) return data[0] || null;
      return data || null;
    } catch (error) {
      throw error;
    }
  },

  getFeatured: async () => {
    try {
      const response = await apiClient.get('/properties', {
        params: { isActive: true },
      });
      const data = normalizeListResponse(response.data);
      // Client-side filter for 'featured' tag to remain backend-agnostic.
      // When migrating to Laravel, replace with a dedicated /properties/featured endpoint
      // or server-side tag filtering.
      return data.filter(
        (p) => Array.isArray(p.tags) && p.tags.includes('featured')
      );
    } catch (error) {
      throw error;
    }
  },

  getByStatus: async (status, params = {}) => {
    try {
      const response = await apiClient.get('/properties', {
        params: { status, isActive: true, ...params },
      });
      return normalizeListResponse(response.data);
    } catch (error) {
      throw error;
    }
  },

  getByType: async (type, params = {}) => {
    try {
      const response = await apiClient.get('/properties', {
        params: { type, isActive: true, ...params },
      });
      return normalizeListResponse(response.data);
    } catch (error) {
      throw error;
    }
  },

  search: async (query, params = {}) => {
    return propertyService.getAll({ q: query, isActive: true, ...params });
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
      return normalizeListResponse(response.data);
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
      const existingNotes = Array.isArray(lead.notes) ? lead.notes : [];
      const updatedNotes = [
        ...existingNotes,
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
      return normalizeListResponse(response.data);
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
      return normalizeListResponse(response.data);
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
      const response = await apiClient.get('/partners', { params });
      const data = normalizeListResponse(response.data);
      return data.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
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
        params: { isActive: true },
      });
      const data = normalizeListResponse(response.data);
      return data.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
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
      const response = await apiClient.get('/faqs', { params });
      const data = normalizeListResponse(response.data);
      return data.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
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
        params: { category, isActive: true },
      });
      const data = normalizeListResponse(response.data);
      return data.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
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
      const response = await apiClient.get('/articles', { params });
      const data = normalizeListResponse(response.data);
      return data.sort(
        (a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0)
      );
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
      // Handle both array (JSON Server) and single object (Laravel) responses
      const data = response.data;
      if (Array.isArray(data)) return data[0] || null;
      return data || null;
    } catch (error) {
      throw error;
    }
  },

  getTrending: async () => {
    try {
      const response = await apiClient.get('/articles', {
        params: { isActive: true, isTrending: true },
      });
      const data = normalizeListResponse(response.data);
      return data.sort((a, b) => (a.trendingOrder ?? 999) - (b.trendingOrder ?? 999));
    } catch (error) {
      throw error;
    }
  },

  getByIds: async (ids) => {
    if (!ids || ids.length === 0) return [];
    try {
      // JSON Server supports ?id=1&id=2 for multiple IDs.
      // For Laravel, replace with POST /articles/by-ids or similar endpoint.
      const params = new URLSearchParams();
      ids.forEach((id) => params.append('id', id));
      const response = await apiClient.get('/articles', { params });
      return normalizeListResponse(response.data);
    } catch (error) {
      throw error;
    }
  },

  getByCategory: async (category, params = {}) => {
    try {
      const response = await apiClient.get('/articles', {
        params: { category, isActive: true, ...params },
      });
      return normalizeListResponse(response.data);
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
      // In production, replace with POST /auth/login endpoint
      const response = await apiClient.get('/adminUsers', {
        params: { email },
      });
      const users = normalizeListResponse(response.data);
      const user = users[0];
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
      return normalizeListResponse(response.data);
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

// === Dashboard Service (Unified API) ===
// When Laravel backend is available, this calls GET /api/dashboard
// which returns all dashboard data in a single request.
// Fallback: the Dashboard component fetches individual endpoints.
export const dashboardService = {
  get: async () => {
    try {
      const response = await apiClient.get('/api/dashboard');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

/*
 * ══════════════════════════════════════════════════════════════
 * Dashboard API Design (for Laravel backend implementation)
 * ══════════════════════════════════════════════════════════════
 *
 * GET /api/dashboard
 *
 * Response Schema:
 * {
 *   "totalProperties": 42,
 *   "activeProperties": 38,
 *   "inactiveProperties": 4,
 *   "totalLeads": 156,
 *   "newLeads7Days": 12,
 *   "totalArticles": 24,
 *   "publishedArticles": 20,
 *   "draftArticles": 4,
 *   "websiteVisits": 12847,        // from visits table (last 30 days)
 *   "leadsBySource": [
 *     { "source": "property-detail-page", "count": 45 },
 *     { "source": "homepage-contact-form", "count": 32 },
 *     ...
 *   ],
 *   "propertiesByStatus": [
 *     { "status": "ready-to-move", "count": 20 },
 *     { "status": "under-construction", "count": 15 },
 *     { "status": "pre-launch", "count": 7 }
 *   ],
 *   "recentLeads": [
 *     {
 *       "id": 1,
 *       "name": "John Doe",
 *       "email": "john@example.com",
 *       "phone": "9876543210",
 *       "source": "property-detail-page",
 *       "propertyId": 5,
 *       "status": "new",
 *       "createdAt": "2026-02-25T10:30:00Z"
 *     },
 *     ... (up to 10 most recent)
 *   ]
 * }
 *
 * Laravel Controller:
 * ─────────────────
 * class DashboardController extends Controller
 * {
 *     public function index()
 *     {
 *         return response()->json([
 *             'totalProperties'    => Property::count(),
 *             'activeProperties'   => Property::where('is_active', true)->count(),
 *             'inactiveProperties' => Property::where('is_active', false)->count(),
 *             'totalLeads'         => Lead::count(),
 *             'newLeads7Days'      => Lead::where('created_at', '>=', now()->subDays(7))->count(),
 *             'totalArticles'      => Article::count(),
 *             'publishedArticles'  => Article::where('is_active', true)->count(),
 *             'draftArticles'      => Article::where('is_active', false)->count(),
 *             'websiteVisits'      => Visit::where('visited_at', '>=', now()->subDays(30))
 *                                         ->distinct('visitor_id')->count('visitor_id'),
 *             'leadsBySource'      => Lead::select('source', DB::raw('count(*) as count'))
 *                                         ->groupBy('source')->get(),
 *             'propertiesByStatus' => Property::where('is_active', true)
 *                                         ->select('status', DB::raw('count(*) as count'))
 *                                         ->groupBy('status')->get(),
 *             'recentLeads'        => Lead::with('property:id,title')
 *                                         ->latest()->limit(10)->get(),
 *         ]);
 *     }
 * }
 *
 * Route (api.php):
 * ─────────────────
 * Route::middleware('auth:sanctum')->group(function () {
 *     Route::get('/dashboard', [DashboardController::class, 'index']);
 * });
 */

// === Visit Tracking Service ===
// Records visitor sessions for website analytics.
// See visitTrackingStrategy below for full design.
export const visitService = {
  record: async (data = {}) => {
    try {
      const response = await apiClient.post('/api/visits', data);
      return response.data;
    } catch {
      // Silently fail — visit tracking should never block UX
    }
  },
};

/*
 * ══════════════════════════════════════════════════════════════
 * TASK 3C — Website Visits Tracking Strategy
 * ══════════════════════════════════════════════════════════════
 *
 * GOAL: Track unique website visits accurately without third-party
 * analytics, in a Laravel/MySQL production environment.
 *
 * ─── 1. How Visits SHOULD Be Counted ───────────────────────
 *
 * A "visit" = one unique session per visitor per time window.
 * NOT page views (which inflate on refresh/navigation).
 *
 * Counting logic:
 * - Generate a visitor_id (UUID stored in localStorage)
 * - On each page load, send visitor_id + metadata to API
 * - Server deduplicates by visitor_id + session window (30 min TTL)
 * - Only one "visit" recorded per visitor per 30-minute window
 *
 * ─── 2. Client-Side Implementation ────────────────────────
 *
 * On app mount (e.g., in App.js or a useEffect hook):
 *
 *   const getVisitorId = () => {
 *     let vid = localStorage.getItem('hom_visitor_id');
 *     if (!vid) {
 *       vid = crypto.randomUUID();
 *       localStorage.setItem('hom_visitor_id', vid);
 *     }
 *     return vid;
 *   };
 *
 *   // Check session window — don't send if last ping < 30 min ago
 *   const lastVisit = sessionStorage.getItem('hom_last_visit');
 *   const now = Date.now();
 *   if (!lastVisit || now - parseInt(lastVisit) > 30 * 60 * 1000) {
 *     visitService.record({
 *       visitor_id: getVisitorId(),
 *       page: window.location.pathname,
 *       referrer: document.referrer || null,
 *       user_agent: navigator.userAgent,
 *     });
 *     sessionStorage.setItem('hom_last_visit', now.toString());
 *   }
 *
 * ─── 3. Laravel/MySQL Database Design ─────────────────────
 *
 * Migration:
 *
 *   Schema::create('visits', function (Blueprint $table) {
 *       $table->id();
 *       $table->string('visitor_id', 64)->index();
 *       $table->string('session_id', 64)->nullable()->index();
 *       $table->ipAddress('ip_address')->nullable();
 *       $table->string('page', 500)->nullable();
 *       $table->string('referrer', 500)->nullable();
 *       $table->string('user_agent', 500)->nullable();
 *       $table->string('device_type', 20)->nullable();    // desktop/mobile/tablet
 *       $table->string('country', 2)->nullable();         // from IP geolocation
 *       $table->timestamp('visited_at')->useCurrent()->index();
 *
 *       // Composite index for dedup check
 *       $table->index(['visitor_id', 'visited_at']);
 *   });
 *
 *   // Optional: daily aggregation table for fast dashboard queries
 *   Schema::create('visit_daily_stats', function (Blueprint $table) {
 *       $table->id();
 *       $table->date('date')->unique();
 *       $table->unsignedInteger('unique_visitors')->default(0);
 *       $table->unsignedInteger('total_visits')->default(0);
 *       $table->unsignedInteger('mobile_visits')->default(0);
 *       $table->unsignedInteger('desktop_visits')->default(0);
 *       $table->timestamps();
 *   });
 *
 * ─── 4. Server-Side Deduplication (Controller) ────────────
 *
 *   class VisitController extends Controller
 *   {
 *       public function store(Request $request)
 *       {
 *           $visitorId = $request->input('visitor_id');
 *           $ip = $request->ip();
 *
 *           // TTL-based dedup: skip if same visitor visited in last 30 min
 *           $recentVisit = Visit::where('visitor_id', $visitorId)
 *               ->where('visited_at', '>=', now()->subMinutes(30))
 *               ->exists();
 *
 *           if ($recentVisit) {
 *               return response()->json(['recorded' => false], 200);
 *           }
 *
 *           Visit::create([
 *               'visitor_id'  => $visitorId,
 *               'session_id'  => Str::random(32),
 *               'ip_address'  => $ip,
 *               'page'        => Str::limit($request->input('page', '/'), 500),
 *               'referrer'    => Str::limit($request->input('referrer'), 500),
 *               'user_agent'  => Str::limit($request->input('user_agent'), 500),
 *               'device_type' => $this->detectDevice($request->userAgent()),
 *               'visited_at'  => now(),
 *           ]);
 *
 *           return response()->json(['recorded' => true], 201);
 *       }
 *
 *       private function detectDevice($ua)
 *       {
 *           if (preg_match('/mobile/i', $ua)) return 'mobile';
 *           if (preg_match('/tablet|ipad/i', $ua)) return 'tablet';
 *           return 'desktop';
 *       }
 *   }
 *
 * ─── 5. Bot Filtering ────────────────────────────────────
 *
 * Add middleware to reject known bots:
 *
 *   class FilterBotVisits
 *   {
 *       public function handle($request, Closure $next)
 *       {
 *           $ua = strtolower($request->userAgent() ?? '');
 *           $bots = ['bot', 'crawler', 'spider', 'scraper',
 *                    'curl', 'wget', 'python', 'headless'];
 *
 *           foreach ($bots as $bot) {
 *               if (str_contains($ua, $bot)) {
 *                   return response()->json(['filtered' => true], 200);
 *               }
 *           }
 *           return $next($request);
 *       }
 *   }
 *
 * ─── 6. Aggregation Strategy ─────────────────────────────
 *
 * Run a daily scheduled command to pre-aggregate stats:
 *
 *   // app/Console/Commands/AggregateVisitStats.php
 *   // Schedule: $schedule->command('visits:aggregate')->dailyAt('02:00');
 *
 *   $date = Carbon::yesterday();
 *   VisitDailyStat::updateOrCreate(
 *       ['date' => $date->toDateString()],
 *       [
 *           'unique_visitors' => Visit::whereDate('visited_at', $date)
 *               ->distinct('visitor_id')->count('visitor_id'),
 *           'total_visits'    => Visit::whereDate('visited_at', $date)->count(),
 *           'mobile_visits'   => Visit::whereDate('visited_at', $date)
 *               ->where('device_type', 'mobile')->count(),
 *           'desktop_visits'  => Visit::whereDate('visited_at', $date)
 *               ->where('device_type', 'desktop')->count(),
 *       ]
 *   );
 *
 * ─── 7. Dashboard Query (Fast) ───────────────────────────
 *
 *   // For dashboard "Website Visits (last 30 days)" card:
 *   $visits30d = VisitDailyStat::where('date', '>=', now()->subDays(30))
 *       ->sum('unique_visitors');
 *
 *   // For charts: daily trend
 *   $dailyTrend = VisitDailyStat::where('date', '>=', now()->subDays(30))
 *       ->orderBy('date')
 *       ->get(['date', 'unique_visitors', 'total_visits']);
 *
 * ─── 8. Summary ──────────────────────────────────────────
 *
 *   ┌──────────────────┬──────────────────────────────────┐
 *   │ Concern          │ Solution                         │
 *   ├──────────────────┼──────────────────────────────────┤
 *   │ Unique visitors  │ localStorage UUID (visitor_id)   │
 *   │ Session window   │ 30-min TTL dedup (server-side)   │
 *   │ Reload inflation │ Client + server dedup prevents   │
 *   │ Bot filtering    │ User-agent middleware             │
 *   │ Storage          │ visits table + daily aggregation  │
 *   │ Performance      │ Composite indexes + pre-aggregation│
 *   │ Privacy          │ No PII stored, IP optional       │
 *   │ Scalability      │ Partition by month if needed     │
 *   └──────────────────┴──────────────────────────────────┘
 *
 * ══════════════════════════════════════════════════════════════
 */

export default apiClient;
