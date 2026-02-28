# API Documentation — Core Authentication & RBAC

> **H.O.M Advisory Platform**
> Backend API specification for Laravel implementation.

---

## 1. System Overview

| Aspect | Detail |
|---|---|
| **Frontend** | React 18 (SPA), Axios HTTP client |
| **Backend Target** | Laravel 11 + MySQL 8 |
| **Auth Strategy** | Laravel Sanctum (token-based) |
| **Base URL (dev)** | `http://localhost:8000/api` |
| **Base URL (prod)** | `https://api.homadvisory.com/api` |
| **API Prefix** | All routes under `/api` |
| **Versioning** | URI-based — `/api/v1/...` when breaking changes are introduced. Start unversioned. |
| **Content-Type** | `application/json` (all requests and responses) |
| **Timeout** | Frontend enforces 15 000 ms per request |

### CORS Configuration

```php
// config/cors.php
return [
    'paths'                => ['api/*'],
    'allowed_methods'      => ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    'allowed_origins'      => [env('FRONTEND_URL', 'http://localhost:3000')],
    'allowed_headers'      => ['Content-Type', 'Authorization', 'X-Requested-With'],
    'exposed_headers'      => [],
    'max_age'              => 86400,
    'supports_credentials' => true,
];
```

---

## 2. Authentication

The frontend stores tokens in `localStorage` under the key `authToken`. Every request includes the token via an Axios interceptor:

```
Authorization: Bearer <token>
```

On **401** response, the frontend clears `authToken`, `adminUser`, and `tokenExpiry` from both `localStorage` and `sessionStorage`, then redirects to `/admin/login`.

### Token Storage Keys

| Key | Storage | Purpose |
|---|---|---|
| `authToken` | localStorage (always) + sessionStorage (if remember=false) | Bearer token |
| `adminUser` | localStorage | Serialized user object `{id, name, email, role, avatar}` |
| `tokenExpiry` | localStorage | ISO 8601 expiry timestamp |

---

### 2.1 POST `/api/auth/login`

Authenticate an admin user and return a Bearer token.

**Request Body**

```json
{
  "email": "admin@homadvisory.com",
  "password": "admin@123"
}
```

**Validation Rules**

| Field | Rules |
|---|---|
| `email` | `required \| email \| max:255` |
| `password` | `required \| string \| min:6` |

**Success Response** — `200 OK`

```json
{
  "user": {
    "id": 1,
    "name": "Super Admin",
    "email": "admin@homadvisory.com",
    "role": "admin",
    "avatar": null
  },
  "token": "1|a4b8f2e1c9d3...",
  "tokenExpiry": "2026-03-01T10:00:00.000Z"
}
```

**Error Response — Invalid Credentials** — `401 Unauthorized`

```json
{
  "message": "Invalid email or password"
}
```

**Error Response — Deactivated Account** — `403 Forbidden`

```json
{
  "message": "Account is deactivated. Contact your administrator."
}
```

**Error Response — Validation** — `422 Unprocessable Entity`

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email field is required."],
    "password": ["The password field is required."]
  }
}
```

**Laravel Implementation**

```php
// app/Http/Controllers/Auth/AuthController.php

public function login(Request $request)
{
    $request->validate([
        'email'    => 'required|email|max:255',
        'password' => 'required|string|min:6',
    ]);

    $user = AdminUser::where('email', $request->email)->first();

    if (!$user || !Hash::check($request->password, $user->password)) {
        return response()->json([
            'message' => 'Invalid email or password',
        ], 401);
    }

    if (!$user->is_active) {
        return response()->json([
            'message' => 'Account is deactivated. Contact your administrator.',
        ], 403);
    }

    $token = $user->createToken('admin-token')->plainTextToken;
    $expiry = now()->addHours(24)->toISOString();

    return response()->json([
        'user' => [
            'id'     => $user->id,
            'name'   => $user->name,
            'email'  => $user->email,
            'role'   => $user->role,
            'avatar' => $user->avatar,
        ],
        'token'       => $token,
        'tokenExpiry' => $expiry,
    ]);
}
```

---

### 2.2 GET `/api/auth/profile`

Return the authenticated user's profile. Requires Bearer token.

**Headers**

```
Authorization: Bearer <token>
```

**Success Response** — `200 OK`

```json
{
  "id": 1,
  "name": "Super Admin",
  "email": "admin@homadvisory.com",
  "role": "admin",
  "avatar": null
}
```

**Error Response** — `401 Unauthorized`

```json
{
  "message": "Unauthenticated."
}
```

**Laravel Implementation**

```php
public function profile(Request $request)
{
    $user = $request->user();

    return response()->json([
        'id'     => $user->id,
        'name'   => $user->name,
        'email'  => $user->email,
        'role'   => $user->role,
        'avatar' => $user->avatar,
    ]);
}
```

---

### 2.3 POST `/api/auth/logout`

Invalidate the current token. Requires Bearer token.

**Headers**

```
Authorization: Bearer <token>
```

**Success Response** — `200 OK`

```json
{
  "message": "Logged out successfully"
}
```

**Error Response** — `401 Unauthorized`

```json
{
  "message": "Unauthenticated."
}
```

**Laravel Implementation**

```php
public function logout(Request $request)
{
    $request->user()->currentAccessToken()->delete();

    return response()->json([
        'message' => 'Logged out successfully',
    ]);
}
```

**Route Registration**

```php
// routes/api.php

Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/profile', [AuthController::class, 'profile']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
});
```

---

## 3. RBAC (Role-Based Access Control)

### 3.1 Roles

| Role | Description |
|---|---|
| `admin` | Full access to all modules |
| `manager` | Access to content and lead management; no settings or SEO |
| `sales` | Access to dashboard and leads only |

### 3.2 Route Permission Matrix

| Route | admin | manager | sales |
|---|:---:|:---:|:---:|
| `/admin/dashboard` | yes | yes | yes |
| `/admin/properties` | yes | yes | — |
| `/admin/leads` | yes | yes | yes |
| `/admin/articles` | yes | yes | — |
| `/admin/seo` | yes | — | — |
| `/admin/faqs` | yes | yes | — |
| `/admin/neighborhoods` | yes | yes | — |
| `/admin/partners` | yes | yes | — |
| `/admin/settings` | yes | — | — |

### 3.3 Laravel Middleware

```php
// app/Http/Middleware/CheckRole.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckRole
{
    public function handle(Request $request, Closure $next, string ...$roles): mixed
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, $roles)) {
            return response()->json([
                'message' => 'Forbidden. Insufficient permissions.',
            ], 403);
        }

        return $next($request);
    }
}
```

Register in `bootstrap/app.php`:

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->alias([
        'role' => \App\Http\Middleware\CheckRole::class,
    ]);
})
```

### 3.4 Route Protection

```php
// routes/api.php

Route::middleware(['auth:sanctum'])->group(function () {

    // All roles
    Route::get('/admin/dashboard', [DashboardController::class, 'index']);
    Route::apiResource('/admin/leads', LeadController::class);

    // Admin + Manager
    Route::middleware('role:admin,manager')->group(function () {
        Route::apiResource('/admin/properties', PropertyController::class);
        Route::apiResource('/admin/articles', ArticleController::class);
        Route::apiResource('/admin/faqs', FaqController::class);
        Route::apiResource('/admin/neighborhoods', NeighborhoodController::class);
        Route::apiResource('/admin/partners', PartnerController::class);
    });

    // Admin only
    Route::middleware('role:admin')->group(function () {
        Route::apiResource('/admin/users', AdminUserController::class);
        Route::get('/admin/seo', [SeoController::class, 'index']);
        Route::patch('/admin/seo', [SeoController::class, 'update']);
        Route::get('/admin/settings', [SiteSettingsController::class, 'show']);
        Route::patch('/admin/settings', [SiteSettingsController::class, 'update']);
    });
});
```

### 3.5 Policy Structure

```php
// app/Policies/LeadPolicy.php

namespace App\Policies;

use App\Models\AdminUser;
use App\Models\Lead;

class LeadPolicy
{
    public function viewAny(AdminUser $user): bool
    {
        return in_array($user->role, ['admin', 'manager', 'sales']);
    }

    public function view(AdminUser $user, Lead $lead): bool
    {
        return in_array($user->role, ['admin', 'manager', 'sales']);
    }

    public function create(AdminUser $user): bool
    {
        return in_array($user->role, ['admin', 'manager', 'sales']);
    }

    public function update(AdminUser $user, Lead $lead): bool
    {
        return in_array($user->role, ['admin', 'manager', 'sales']);
    }

    public function delete(AdminUser $user, Lead $lead): bool
    {
        return in_array($user->role, ['admin', 'manager']);
    }
}
```

---

## 4. Standard Response Format

### 4.1 Success — Single Resource

```json
{
  "id": 1,
  "name": "Super Admin",
  "email": "admin@homadvisory.com",
  "role": "admin",
  "avatar": null,
  "createdAt": "2025-01-15T10:00:00.000Z",
  "updatedAt": "2025-01-15T10:00:00.000Z"
}
```

### 4.2 Success — List (Paginated)

The frontend `normalizeListResponse` extracts data from three shapes:
1. Raw array — `[...]`
2. Laravel paginated — `{ "data": [...], ... }`
3. Items wrapper — `{ "items": [...] }`

Use Laravel's default paginator format:

```json
{
  "data": [
    { "id": 1, "title": "..." },
    { "id": 2, "title": "..." }
  ],
  "current_page": 1,
  "last_page": 5,
  "per_page": 15,
  "total": 72,
  "from": 1,
  "to": 15
}
```

The frontend will read `response.data.data` (the inner `data` array) via `normalizeListResponse`.

### 4.3 Validation Error — `422 Unprocessable Entity`

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": [
      "The email field is required."
    ],
    "password": [
      "The password must be at least 6 characters."
    ]
  }
}
```

### 4.4 Unauthorized — `401`

Returned when no valid token is provided or token has expired.

```json
{
  "message": "Unauthenticated."
}
```

Frontend behavior: clears auth storage, redirects to `/admin/login`.

### 4.5 Forbidden — `403`

Returned when the user's role lacks permission for the resource.

```json
{
  "message": "Forbidden. Insufficient permissions."
}
```

### 4.6 Not Found — `404`

```json
{
  "message": "Resource not found."
}
```

### 4.7 Server Error — `500`

```json
{
  "message": "Internal server error."
}
```

---

## 5. Dashboard Endpoint

### GET `/api/admin/dashboard`

Returns all dashboard metrics in a single aggregated response. Protected by `auth:sanctum`. Accessible by all roles (`admin`, `manager`, `sales`).

**Success Response** — `200 OK`

```json
{
  "totalProperties": 42,
  "activeProperties": 38,
  "inactiveProperties": 4,
  "totalLeads": 156,
  "newLeads7Days": 12,
  "totalArticles": 24,
  "publishedArticles": 20,
  "draftArticles": 4,
  "websiteVisits": 12847,
  "leadsBySource": [
    { "source": "property-detail-page", "count": 45 },
    { "source": "homepage-contact-form", "count": 32 },
    { "source": "newsletter", "count": 18 },
    { "source": "brochure_download", "count": 14 }
  ],
  "propertiesByStatus": [
    { "status": "ready-to-move", "count": 20 },
    { "status": "under-construction", "count": 15 },
    { "status": "pre-launch", "count": 7 }
  ],
  "recentLeads": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "9876543210",
      "source": "property-detail-page",
      "propertyId": 5,
      "status": "new",
      "createdAt": "2026-02-25T10:30:00Z"
    }
  ]
}
```

### Field Descriptions

| Field | Type | Source |
|---|---|---|
| `totalProperties` | integer | `Property::count()` |
| `activeProperties` | integer | `Property::where('is_active', true)->count()` |
| `inactiveProperties` | integer | `Property::where('is_active', false)->count()` |
| `totalLeads` | integer | `Lead::count()` |
| `newLeads7Days` | integer | `Lead::where('created_at', '>=', now()->subDays(7))->count()` |
| `totalArticles` | integer | `Article::count()` |
| `publishedArticles` | integer | `Article::where('is_active', true)->count()` |
| `draftArticles` | integer | `Article::where('is_active', false)->count()` |
| `websiteVisits` | integer | `Visit::where('visited_at', '>=', now()->subDays(30))->distinct('visitor_id')->count('visitor_id')` |
| `leadsBySource` | array | Grouped count by `source` |
| `propertiesByStatus` | array | Grouped count by `status` (active only) |
| `recentLeads` | array | Latest 10 leads with property relation |

### Laravel Controller

```php
// app/Http/Controllers/Admin/DashboardController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Property;
use App\Models\Lead;
use App\Models\Article;
use App\Models\Visit;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        return response()->json([
            'totalProperties'    => Property::count(),
            'activeProperties'   => Property::where('is_active', true)->count(),
            'inactiveProperties' => Property::where('is_active', false)->count(),
            'totalLeads'         => Lead::count(),
            'newLeads7Days'      => Lead::where('created_at', '>=', now()->subDays(7))->count(),
            'totalArticles'      => Article::count(),
            'publishedArticles'  => Article::where('is_active', true)->count(),
            'draftArticles'      => Article::where('is_active', false)->count(),
            'websiteVisits'      => Visit::where('visited_at', '>=', now()->subDays(30))
                                        ->distinct('visitor_id')
                                        ->count('visitor_id'),
            'leadsBySource'      => Lead::select('source', DB::raw('count(*) as count'))
                                        ->groupBy('source')
                                        ->get(),
            'propertiesByStatus' => Property::where('is_active', true)
                                        ->select('status', DB::raw('count(*) as count'))
                                        ->groupBy('status')
                                        ->get(),
            'recentLeads'        => Lead::with('property:id,title')
                                        ->latest()
                                        ->limit(10)
                                        ->get(),
        ]);
    }
}
```

### Suggested SQL Queries

```sql
-- Total / active / inactive properties
SELECT COUNT(*) AS totalProperties FROM properties;
SELECT COUNT(*) AS activeProperties FROM properties WHERE is_active = 1;
SELECT COUNT(*) AS inactiveProperties FROM properties WHERE is_active = 0;

-- Lead counts
SELECT COUNT(*) AS totalLeads FROM leads;
SELECT COUNT(*) AS newLeads7Days FROM leads WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY);

-- Article counts
SELECT COUNT(*) AS totalArticles FROM articles;
SELECT COUNT(*) AS publishedArticles FROM articles WHERE is_active = 1;
SELECT COUNT(*) AS draftArticles FROM articles WHERE is_active = 0;

-- Unique website visits (last 30 days)
SELECT COUNT(DISTINCT visitor_id) AS websiteVisits
FROM visits
WHERE visited_at >= DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Leads grouped by source
SELECT source, COUNT(*) AS count
FROM leads
GROUP BY source
ORDER BY count DESC;

-- Properties grouped by status (active only)
SELECT status, COUNT(*) AS count
FROM properties
WHERE is_active = 1
GROUP BY status;

-- Recent leads (latest 10)
SELECT l.id, l.name, l.email, l.phone, l.source, l.property_id, l.status, l.created_at
FROM leads l
ORDER BY l.created_at DESC
LIMIT 10;
```

### Recommended Indexes

```sql
-- properties table
CREATE INDEX idx_properties_is_active ON properties (is_active);
CREATE INDEX idx_properties_status_active ON properties (status, is_active);

-- leads table
CREATE INDEX idx_leads_created_at ON leads (created_at);
CREATE INDEX idx_leads_source ON leads (source);
CREATE INDEX idx_leads_status ON leads (status);

-- articles table
CREATE INDEX idx_articles_is_active ON articles (is_active);

-- visits table
CREATE INDEX idx_visits_visitor_id ON visits (visitor_id);
CREATE INDEX idx_visits_visited_at ON visits (visited_at);
CREATE INDEX idx_visits_visitor_visited ON visits (visitor_id, visited_at);
```
