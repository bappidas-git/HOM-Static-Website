# H.O.M Advisory — Backend API Documentation

## Core Authentication, RBAC & Dashboard

---

## 1. SYSTEM OVERVIEW

### Tech Stack

| Layer    | Technology                        |
| -------- | --------------------------------- |
| Frontend | React 18 (SPA, Axios HTTP client) |
| Backend  | Laravel 11 (target)               |
| Auth     | Laravel Sanctum (token-based)     |
| Database | MySQL 8                           |
| API      | RESTful JSON                      |

### Base URL

```
Development : http://localhost:8000/api
Staging     : https://staging-core.homadvisory.com/api
Production  : https://core.homadvisory.com/api
```

The frontend reads `REACT_APP_API_URL` from environment. All endpoints below are relative to this base.

### API Versioning

Prefix all routes with `/api`. When breaking changes are introduced, move to `/api/v2`.
For now, a single unversioned `/api` prefix is sufficient.

### Content-Type

All requests and responses use:

```
Content-Type: application/json
Accept: application/json
```

### CORS

Laravel should allow the frontend origin via `config/cors.php`:

```php
'allowed_origins' => [
    'http://localhost:3000',
    'https://homadvisory.com',
    'https://www.homadvisory.com',
],
'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
'allowed_headers' => ['Content-Type', 'Authorization', 'X-Requested-With'],
'supports_credentials' => true,
```

---

## 2. AUTHENTICATION

The frontend stores the token in `localStorage` under key `authToken` and attaches it to every request via Axios interceptor:

```
Authorization: Bearer <token>
```

On **401** response, the interceptor clears `authToken`, `adminUser`, and `tokenExpiry` from both `localStorage` and `sessionStorage`, then redirects to `/admin/login`.

### Recommended: Laravel Sanctum

Use Sanctum's API token authentication (not SPA/cookie mode). Each login issues a personal access token with a 24-hour expiry.

---

### POST /api/auth/login

Authenticate an admin user and return a Bearer token.

**Request Body**

```json
{
  "email": "admin@homadvisory.com",
  "password": "admin@123"
}
```

**Validation Rules**

| Field      | Rules                            |
| ---------- | -------------------------------- |
| `email`    | required, string, email, max:255 |
| `password` | required, string, min:6, max:128 |

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
  "token": "3|a1b2c3d4e5f6...",
  "tokenExpiry": "2026-03-02T10:00:00.000Z"
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
// app/Http/Controllers/Auth/LoginController.php

public function login(Request $request)
{
    $request->validate([
        'email'    => 'required|string|email|max:255',
        'password' => 'required|string|min:6|max:128',
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

    $expiry = now()->addHours(24);
    $token  = $user->createToken('admin-token', ['*'], $expiry)->plainTextToken;

    return response()->json([
        'user' => [
            'id'     => $user->id,
            'name'   => $user->name,
            'email'  => $user->email,
            'role'   => $user->role,
            'avatar' => $user->avatar,
        ],
        'token'       => $token,
        'tokenExpiry' => $expiry->toISOString(),
    ]);
}
```

---

### GET /api/auth/profile

Return the authenticated user's profile.

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

### POST /api/auth/logout

Revoke the current token.

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

Route::post('/auth/login', [LoginController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/profile', [LoginController::class, 'profile']);
    Route::post('/auth/logout', [LoginController::class, 'logout']);
});
```

---

## 3. RBAC (ROLE-BASED ACCESS CONTROL)

### Roles

| Role      | Description                                   |
| --------- | --------------------------------------------- |
| `admin`   | Full access to all modules and settings       |
| `manager` | Content & lead management, no system settings |
| `sales`   | Dashboard and leads only                      |

### Route Permissions Matrix

| Route                  | admin | manager | sales |
| ---------------------- | :---: | :-----: | :---: |
| `/admin/dashboard`     |  Yes  |   Yes   |  Yes  |
| `/admin/properties`    |  Yes  |   Yes   |  No   |
| `/admin/leads`         |  Yes  |   Yes   |  Yes  |
| `/admin/articles`      |  Yes  |   Yes   |  No   |
| `/admin/seo`           |  Yes  |   No    |  No   |
| `/admin/faqs`          |  Yes  |   Yes   |  No   |
| `/admin/neighborhoods` |  Yes  |   Yes   |  No   |
| `/admin/partners`      |  Yes  |   Yes   |  No   |
| `/admin/settings`      |  Yes  |   No    |  No   |

### Middleware

Create a custom middleware to check the user's role against allowed roles per route:

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

### Route Protection Examples

```php
// routes/api.php

Route::middleware(['auth:sanctum'])->prefix('admin')->group(function () {

    // All authenticated users
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Admin & Manager only
    Route::middleware('role:admin,manager')->group(function () {
        Route::apiResource('properties', PropertyController::class);
        Route::apiResource('articles', ArticleController::class);
        Route::apiResource('faqs', FaqController::class);
        Route::apiResource('neighborhoods', NeighborhoodController::class);
        Route::apiResource('partners', PartnerController::class);
    });

    // Admin & Manager & Sales
    Route::middleware('role:admin,manager,sales')->group(function () {
        Route::apiResource('leads', LeadController::class);
    });

    // Admin only
    Route::middleware('role:admin')->group(function () {
        Route::apiResource('users', AdminUserController::class);
        Route::get('/settings', [SiteSettingsController::class, 'show']);
        Route::patch('/settings', [SiteSettingsController::class, 'update']);
        Route::get('/seo', [SeoController::class, 'index']);
        Route::patch('/seo', [SeoController::class, 'update']);
    });
});
```

### Policy Structure

For granular authorization beyond route-level checks, use Laravel Policies:

```php
// app/Policies/PropertyPolicy.php

namespace App\Policies;

use App\Models\AdminUser;
use App\Models\Property;

class PropertyPolicy
{
    public function viewAny(AdminUser $user): bool
    {
        return in_array($user->role, ['admin', 'manager']);
    }

    public function create(AdminUser $user): bool
    {
        return in_array($user->role, ['admin', 'manager']);
    }

    public function update(AdminUser $user, Property $property): bool
    {
        return in_array($user->role, ['admin', 'manager']);
    }

    public function delete(AdminUser $user, Property $property): bool
    {
        return $user->role === 'admin';
    }
}
```

Register policies in `AppServiceProvider`:

```php
use Illuminate\Support\Facades\Gate;

public function boot(): void
{
    Gate::policy(Property::class, PropertyPolicy::class);
    Gate::policy(Lead::class, LeadPolicy::class);
    Gate::policy(Article::class, ArticlePolicy::class);
}
```

---

## 4. STANDARD RESPONSE FORMAT

### Success — Single Resource

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

### Success — Paginated List

The frontend `normalizeListResponse` handles both flat arrays and paginated objects. It checks for `data.data` (Laravel pagination) and `data.items` as fallbacks.

Return Laravel's standard pagination:

```json
{
  "data": [
    { "id": 1, "title": "Property A" },
    { "id": 2, "title": "Property B" }
  ],
  "current_page": 1,
  "per_page": 15,
  "total": 42,
  "last_page": 3,
  "from": 1,
  "to": 15
}
```

The frontend extracts the `data` array via `normalizeListResponse`:

```js
const normalizeListResponse = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  if (data && Array.isArray(data.items)) return data.items;
  return [];
};
```

### Validation Error — `422 Unprocessable Entity`

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email field is required."],
    "password": ["The password must be at least 6 characters."]
  }
}
```

### Unauthenticated — `401 Unauthorized`

Returned when no token is provided or token is expired/invalid.

```json
{
  "message": "Unauthenticated."
}
```

Frontend behavior: clears all auth storage (`authToken`, `adminUser`, `tokenExpiry`) and redirects to `/admin/login`.

### Forbidden — `403 Forbidden`

Returned when the user's role lacks permission for the requested resource.

```json
{
  "message": "Forbidden. Insufficient permissions."
}
```

### Not Found — `404 Not Found`

```json
{
  "message": "Resource not found."
}
```

### Server Error — `500 Internal Server Error`

```json
{
  "message": "An unexpected error occurred. Please try again later."
}
```

---

## 5. DASHBOARD ENDPOINT

### GET /api/admin/dashboard

Returns aggregated statistics for the admin dashboard. Requires authentication. All roles (`admin`, `manager`, `sales`) can access this endpoint.

**Headers**

```
Authorization: Bearer <token>
```

### Required Response Fields

| Field                | Type    | Description                                 |
| -------------------- | ------- | ------------------------------------------- |
| `totalProperties`    | integer | Total property count                        |
| `activeProperties`   | integer | Properties where `is_active = true`         |
| `inactiveProperties` | integer | Properties where `is_active = false`        |
| `totalLeads`         | integer | Total lead count                            |
| `newLeads7Days`      | integer | Leads created in the last 7 days            |
| `totalArticles`      | integer | Total article count                         |
| `publishedArticles`  | integer | Articles where `is_active = true`           |
| `draftArticles`      | integer | Articles where `is_active = false`          |
| `websiteVisits`      | integer | Unique visitors in the last 30 days         |
| `leadsBySource`      | array   | Lead count grouped by source                |
| `propertiesByStatus` | array   | Active property count grouped by status     |
| `recentLeads`        | array   | 10 most recent leads with property relation |

### Example Response — `200 OK`

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
    { "source": "brochure_download", "count": 14 },
    { "source": "property-listing-page", "count": 11 }
  ],
  "propertiesByStatus": [
    { "status": "ready-to-move", "count": 20 },
    { "status": "under-construction", "count": 15 },
    { "status": "pre-launch", "count": 7 }
  ],
  "recentLeads": [
    {
      "id": 1,
      "name": "Rajesh Kumar",
      "email": "rajesh.kumar@gmail.com",
      "phone": "+91 98765 43210",
      "source": "property-detail-page",
      "propertyId": 1,
      "status": "contacted",
      "createdAt": "2025-12-15T14:00:00Z"
    }
  ]
}
```

### Laravel Controller

```php
// app/Http/Controllers/Admin/DashboardController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Property;
use App\Models\Lead;
use App\Models\Article;
use App\Models\VisitDailyStat;
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
            'websiteVisits'      => VisitDailyStat::where('date', '>=', now()->subDays(30))
                                        ->sum('unique_visitors'),
            'leadsBySource'      => Lead::select('source', DB::raw('COUNT(*) as count'))
                                        ->groupBy('source')
                                        ->orderByDesc('count')
                                        ->get(),
            'propertiesByStatus' => Property::where('is_active', true)
                                        ->select('status', DB::raw('COUNT(*) as count'))
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

**Total & active properties:**

```sql
SELECT COUNT(*) AS total FROM properties;
SELECT COUNT(*) AS active FROM properties WHERE is_active = 1;
```

**Leads in last 7 days:**

```sql
SELECT COUNT(*) AS new_leads_7d
FROM leads
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY);
```

**Leads by source:**

```sql
SELECT source, COUNT(*) AS count
FROM leads
GROUP BY source
ORDER BY count DESC;
```

**Properties by status (active only):**

```sql
SELECT status, COUNT(*) AS count
FROM properties
WHERE is_active = 1
GROUP BY status;
```

**Recent leads with property title:**

```sql
SELECT l.id, l.name, l.email, l.phone, l.source, l.property_id,
       l.status, l.created_at, p.title AS property_title
FROM leads l
LEFT JOIN properties p ON l.property_id = p.id
ORDER BY l.created_at DESC
LIMIT 10;
```

**Unique visitors (last 30 days, from aggregation table):**

```sql
SELECT SUM(unique_visitors) AS website_visits
FROM visit_daily_stats
WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY);
```

### Index Recommendations

```sql
-- Properties
CREATE INDEX idx_properties_is_active ON properties(is_active);
CREATE INDEX idx_properties_status_active ON properties(status, is_active);

-- Leads
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_status ON leads(status);

-- Visit daily stats
CREATE INDEX idx_visit_stats_date ON visit_daily_stats(date);

-- Visits (raw table)
CREATE INDEX idx_visits_visitor_visited ON visits(visitor_id, visited_at);
```
