# API Documentation — Admin Modules

> Backend API specification for **Leads**, **Admin Users**, and **Site Settings** modules.
> Target stack: Laravel 11 + MySQL 8 — Auth via Sanctum (Bearer token).

---

## Table of Contents

1. [Leads Module](#1-leads-module)
2. [Admin Users Module](#2-admin-users-module)
3. [Site Settings Module](#3-site-settings-module)
4. [Permission Requirements](#4-permission-requirements)

---

## 1. Leads Module

### 1.1 Database Tables

#### `leads`

| Column           | Type                | Constraints                        |
|------------------|---------------------|------------------------------------|
| id               | BIGINT UNSIGNED     | PK, AUTO_INCREMENT                 |
| name             | VARCHAR(255)        | NOT NULL                           |
| email            | VARCHAR(255)        | NULLABLE                           |
| phone            | VARCHAR(20)         | NOT NULL                           |
| source           | VARCHAR(50)         | NOT NULL, DEFAULT `'website'`      |
| property_id      | BIGINT UNSIGNED     | NULLABLE, FK → properties(id) ON DELETE SET NULL |
| message          | TEXT                | NULLABLE                           |
| status           | ENUM                | NOT NULL, DEFAULT `'new'`          |
| assessment_data  | JSON                | NULLABLE                           |
| created_at       | TIMESTAMP           | NOT NULL, DEFAULT CURRENT_TIMESTAMP|
| updated_at       | TIMESTAMP           | NOT NULL, ON UPDATE CURRENT_TIMESTAMP |

#### `lead_notes`

| Column     | Type            | Constraints                            |
|------------|-----------------|----------------------------------------|
| id         | BIGINT UNSIGNED | PK, AUTO_INCREMENT                     |
| lead_id    | BIGINT UNSIGNED | NOT NULL, FK → leads(id) ON DELETE CASCADE |
| text       | TEXT            | NOT NULL                               |
| added_by   | BIGINT UNSIGNED | NULLABLE, FK → admin_users(id) ON DELETE SET NULL |
| added_at   | TIMESTAMP       | NOT NULL, DEFAULT CURRENT_TIMESTAMP    |

### 1.2 Enums

#### Status Enum

| Value        | Description                   |
|--------------|-------------------------------|
| `new`        | Freshly submitted, untouched  |
| `contacted`  | Admin has reached out         |
| `qualified`  | Lead is a viable prospect     |
| `lost`       | Lead closed / not interested  |
| `converted`  | Lead converted to customer    |

#### Source Enum

| Value                      | Description                        |
|----------------------------|------------------------------------|
| `website`                  | Generic website form               |
| `property-detail-page`     | Enquiry from property detail page  |
| `property-listing-page`    | Enquiry from listings page         |
| `homepage-contact-form`    | Homepage contact section           |
| `property_enquiry`         | Property enquiry widget            |
| `detailed_pricing`         | Detailed pricing request           |
| `financial-assessment`     | Financial assessment tool          |

### 1.3 Validation Rules

| Field   | Rules                                                                 |
|---------|-----------------------------------------------------------------------|
| name    | Required, min 2 chars, regex: `/^[a-zA-Z\s.'\-]+$/`                  |
| email   | Optional (unless source requires it), format: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` |
| phone   | Required, 10–15 digits, format: `/^[+]?[\d\s()\-]{10,15}$/`         |
| source  | Required, must be a valid source enum value                           |
| message | Optional, max 2000 chars                                              |

All string inputs are sanitized: trimmed and internal whitespace collapsed to single spaces.

### 1.4 Endpoints

---

#### `POST /api/leads` (Public)

Create a new lead from a public-facing form. **No authentication required.**

**Request:**

```json
{
  "name": "Rajesh Kumar",
  "email": "rajesh.kumar@gmail.com",
  "phone": "+91 98765 43210",
  "source": "property-detail-page",
  "propertyId": 1,
  "message": "Interested in 3 BHK. Please share pricing details."
}
```

**Response (201):**

```json
{
  "id": 10,
  "name": "Rajesh Kumar",
  "email": "rajesh.kumar@gmail.com",
  "phone": "+91 98765 43210",
  "source": "property-detail-page",
  "property_id": 1,
  "message": "Interested in 3 BHK. Please share pricing details.",
  "status": "new",
  "assessment_data": null,
  "created_at": "2026-02-28T10:00:00.000000Z",
  "updated_at": "2026-02-28T10:00:00.000000Z"
}
```

**Validation Errors (422):**

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "name": ["Full Name is required"],
    "phone": ["Phone number must be at least 10 digits"]
  }
}
```

**Notes:**
- Status is always set to `new` server-side (ignore any client-provided value).
- `assessment_data` accepts arbitrary JSON from the financial assessment tool.
- Rate limit: 10 requests per minute per IP recommended.

---

#### `GET /api/admin/leads`

List all leads with filtering, sorting, and pagination.

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**

| Param      | Type    | Default       | Description                              |
|------------|---------|---------------|------------------------------------------|
| page       | int     | 1             | Page number                              |
| per_page   | int     | 20            | Results per page (max 100)               |
| status     | string  | —             | Filter by status enum value              |
| source     | string  | —             | Filter by source enum value              |
| search     | string  | —             | Search name, email, phone                |
| sort_by    | string  | `created_at`  | Column to sort by                        |
| sort_order | string  | `desc`        | `asc` or `desc`                          |

**Response (200):**

```json
{
  "data": [
    {
      "id": 1,
      "name": "Rajesh Kumar",
      "email": "rajesh.kumar@gmail.com",
      "phone": "+91 98765 43210",
      "source": "property-detail-page",
      "property_id": 1,
      "message": "Interested in 3 BHK.",
      "status": "contacted",
      "assessment_data": null,
      "notes_count": 1,
      "created_at": "2025-12-15T14:00:00.000000Z",
      "updated_at": "2025-12-18T10:30:00.000000Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 3,
    "per_page": 20,
    "total": 56
  }
}
```

---

#### `GET /api/admin/leads/{id}`

Get a single lead with its notes.

**Headers:** `Authorization: Bearer {token}`

**Response (200):**

```json
{
  "id": 1,
  "name": "Rajesh Kumar",
  "email": "rajesh.kumar@gmail.com",
  "phone": "+91 98765 43210",
  "source": "property-detail-page",
  "property_id": 1,
  "message": "Interested in 3 BHK.",
  "status": "contacted",
  "assessment_data": null,
  "notes": [
    {
      "id": 1,
      "text": "Called back, interested in 3BHK. Site visit scheduled for Saturday.",
      "added_by": 1,
      "added_at": "2025-12-18T10:30:00.000000Z"
    }
  ],
  "property": {
    "id": 1,
    "title": "Nambiar District 25 Phase 2"
  },
  "created_at": "2025-12-15T14:00:00.000000Z",
  "updated_at": "2025-12-18T10:30:00.000000Z"
}
```

**Error (404):**

```json
{
  "message": "Lead not found."
}
```

---

#### `PUT /api/admin/leads/{id}`

Update lead status, contact info, or other fields.

**Headers:** `Authorization: Bearer {token}`

**Request:**

```json
{
  "status": "qualified",
  "email": "rajesh.updated@gmail.com"
}
```

**Response (200):** Updated lead object (same shape as GET single).

**Allowed updatable fields:** `name`, `email`, `phone`, `status`, `message`, `property_id`

---

#### `DELETE /api/admin/leads/{id}`

Delete a lead and all associated notes.

**Headers:** `Authorization: Bearer {token}`

**Response (200):**

```json
{
  "message": "Lead deleted successfully."
}
```

---

#### `POST /api/admin/leads/{id}/notes`

Add a note to an existing lead.

**Headers:** `Authorization: Bearer {token}`

**Request:**

```json
{
  "text": "Called back, interested in 3BHK. Site visit scheduled for Saturday."
}
```

**Validation:** `text` is required, max 2000 chars.

**Response (201):**

```json
{
  "id": 5,
  "lead_id": 1,
  "text": "Called back, interested in 3BHK. Site visit scheduled for Saturday.",
  "added_by": 1,
  "added_at": "2026-02-28T10:30:00.000000Z"
}
```

### 1.5 Migration Sample

```php
// database/migrations/xxxx_xx_xx_create_leads_table.php

Schema::create('leads', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('email')->nullable();
    $table->string('phone', 20);
    $table->string('source', 50)->default('website');
    $table->foreignId('property_id')->nullable()->constrained()->nullOnDelete();
    $table->text('message')->nullable();
    $table->enum('status', ['new', 'contacted', 'qualified', 'lost', 'converted'])->default('new');
    $table->json('assessment_data')->nullable();
    $table->timestamps();

    $table->index('status');
    $table->index('source');
    $table->index('created_at');
});

Schema::create('lead_notes', function (Blueprint $table) {
    $table->id();
    $table->foreignId('lead_id')->constrained()->cascadeOnDelete();
    $table->text('text');
    $table->foreignId('added_by')->nullable()->constrained('admin_users')->nullOnDelete();
    $table->timestamp('added_at')->useCurrent();
});
```

---

## 2. Admin Users Module

### 2.1 Database Table

#### `admin_users`

| Column     | Type            | Constraints                         |
|------------|-----------------|-------------------------------------|
| id         | BIGINT UNSIGNED | PK, AUTO_INCREMENT                  |
| name       | VARCHAR(255)    | NOT NULL                            |
| email      | VARCHAR(255)    | NOT NULL, UNIQUE                    |
| password   | VARCHAR(255)    | NOT NULL (bcrypt hash)              |
| role       | ENUM            | NOT NULL, DEFAULT `'sales'`         |
| is_active  | BOOLEAN         | NOT NULL, DEFAULT `true`            |
| avatar     | VARCHAR(500)    | NULLABLE                            |
| created_at | TIMESTAMP       | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP       | NOT NULL, ON UPDATE CURRENT_TIMESTAMP |

#### Role Enum

| Value     | Description                              |
|-----------|------------------------------------------|
| `admin`   | Full access to all modules and settings  |
| `manager` | Access to properties, leads, articles, FAQs, neighborhoods, partners |
| `sales`   | Access to dashboard and leads only       |

### 2.2 Endpoints

---

#### `GET /api/admin/users`

List all admin users.

**Headers:** `Authorization: Bearer {token}`

**Response (200):**

```json
[
  {
    "id": 1,
    "name": "Super Admin",
    "email": "admin@homadvisory.com",
    "role": "admin",
    "is_active": true,
    "avatar": null,
    "created_at": "2025-01-15T10:00:00.000000Z",
    "updated_at": "2025-01-15T10:00:00.000000Z"
  }
]
```

**Note:** Password is **never** included in responses.

---

#### `POST /api/admin/users`

Create a new admin user.

**Headers:** `Authorization: Bearer {token}`

**Request:**

```json
{
  "name": "New Manager",
  "email": "newmanager@homadvisory.com",
  "password": "SecurePass123!",
  "role": "manager",
  "is_active": true
}
```

**Validation:**

| Field    | Rules                                              |
|----------|----------------------------------------------------|
| name     | Required, min 2 chars, max 255                     |
| email    | Required, valid email, unique in `admin_users`     |
| password | Required, min 8 chars                              |
| role     | Required, must be one of: `admin`, `manager`, `sales` |
| is_active| Optional, boolean, defaults to `true`              |

**Response (201):**

```json
{
  "id": 4,
  "name": "New Manager",
  "email": "newmanager@homadvisory.com",
  "role": "manager",
  "is_active": true,
  "avatar": null,
  "created_at": "2026-02-28T12:00:00.000000Z",
  "updated_at": "2026-02-28T12:00:00.000000Z"
}
```

**Password Hashing:** Passwords must be hashed with `bcrypt` before storage. Never store plaintext passwords.

```php
// In UserController or FormRequest
$validated['password'] = Hash::make($validated['password']);
```

**Unique Email Error (422):**

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email has already been taken."]
  }
}
```

---

#### `PUT /api/admin/users/{id}`

Update an admin user. Password field is optional — only hash and update if provided.

**Headers:** `Authorization: Bearer {token}`

**Request:**

```json
{
  "name": "Updated Name",
  "role": "admin",
  "is_active": true
}
```

**Validation:** Same as create, except `password` and `email` are optional. If `email` is provided, it must be unique excluding the current user (`unique:admin_users,email,{id}`).

**Response (200):** Updated user object (same shape as GET, no password).

---

#### `DELETE /api/admin/users/{id}`

Delete an admin user.

**Headers:** `Authorization: Bearer {token}`

**Response (200):**

```json
{
  "message": "User deleted successfully."
}
```

**Guard — Prevent Deleting Last Admin (403):**

```json
{
  "message": "Cannot delete the last admin user."
}
```

**Implementation:**

```php
public function destroy(AdminUser $user)
{
    if ($user->role === 'admin') {
        $adminCount = AdminUser::where('role', 'admin')->count();
        if ($adminCount <= 1) {
            return response()->json([
                'message' => 'Cannot delete the last admin user.'
            ], 403);
        }
    }

    $user->delete();
    return response()->json(['message' => 'User deleted successfully.']);
}
```

**Guard — Prevent Self-Deletion (403):**

```json
{
  "message": "You cannot delete your own account."
}
```

### 2.3 Migration Sample

```php
// database/migrations/xxxx_xx_xx_create_admin_users_table.php

Schema::create('admin_users', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('email')->unique();
    $table->string('password');
    $table->enum('role', ['admin', 'manager', 'sales'])->default('sales');
    $table->boolean('is_active')->default(true);
    $table->string('avatar', 500)->nullable();
    $table->timestamps();
});
```

**Seeder:**

```php
// database/seeders/AdminUserSeeder.php

AdminUser::create([
    'name'     => 'Super Admin',
    'email'    => 'admin@homadvisory.com',
    'password' => Hash::make('admin@123'),
    'role'     => 'admin',
    'is_active'=> true,
]);
```

---

## 3. Site Settings Module

### 3.1 Storage Strategy

Site settings are stored as a **single JSON document** (one row in a key-value table or a dedicated `site_settings` table with a single row). This avoids creating columns for every setting and allows flexible, schema-less updates.

#### `site_settings` Table

| Column     | Type            | Constraints            |
|------------|-----------------|------------------------|
| id         | BIGINT UNSIGNED | PK, fixed value `1`    |
| data       | JSON            | NOT NULL               |
| updated_at | TIMESTAMP       | ON UPDATE CURRENT_TIMESTAMP |

Alternatively, use Laravel's config-based approach with a singleton row:

```php
// Always fetch/update row with id = 1
SiteSetting::firstOrCreate(['id' => 1], ['data' => $defaults]);
```

### 3.2 Settings Structure

```json
{
  "contactInfo": {
    "phone": "(555) 123-4567",
    "email": "info@homadvisory.com",
    "address": "123 Luxury Ave, Suite 100, Bangalore, Karnataka 560001"
  },
  "socialLinks": {
    "instagram": "https://instagram.com/homadvisory",
    "facebook": "https://facebook.com/homadvisory",
    "twitter": "https://twitter.com/homadvisory",
    "linkedin": "https://linkedin.com/company/homadvisory"
  },
  "heroText": {
    "title": "Find Your Dream Home",
    "subtitle": "Discover the perfect property from our exclusive collection",
    "backgroundMedia": "https://video.gumlet.io/...",
    "backgroundImage": "https://res.cloudinary.com/..."
  },
  "companyName": "H.O.M Advisory",
  "companySubtitle": "HOME OFFICE MARKET",
  "companyDescription": "Your connection to the finest homes...",
  "tagline": "ELEVATING EVERY EXPERIENCE IN REAL ESTATE",
  "newsletterText": "Get latest real estate updates in your inbox",
  "newsletterSubtitle": "Subscribe & Stay Updated",
  "footerLinkGroups": [
    {
      "title": "Homes",
      "links": [
        { "label": "Buy", "path": "/buy/ready-to-move" },
        { "label": "Rent", "path": "/rent/apartments" }
      ]
    }
  ],
  "footerGallery": [
    "https://images.unsplash.com/photo-..."
  ]
}
```

### 3.3 Endpoints

---

#### `GET /api/settings` (Public)

Fetch current site settings. **No authentication required.**

**Response (200):**

```json
{
  "contactInfo": { "phone": "...", "email": "...", "address": "..." },
  "socialLinks": { "instagram": "...", "facebook": "...", "twitter": "...", "linkedin": "..." },
  "heroText": { "title": "...", "subtitle": "...", "backgroundMedia": "...", "backgroundImage": "..." },
  "companyName": "H.O.M Advisory",
  "companySubtitle": "HOME OFFICE MARKET",
  "companyDescription": "...",
  "tagline": "...",
  "newsletterText": "...",
  "newsletterSubtitle": "...",
  "footerLinkGroups": [],
  "footerGallery": []
}
```

---

#### `PUT /api/admin/settings`

Update site settings. Accepts a partial or full JSON payload — merges with existing settings.

**Headers:** `Authorization: Bearer {token}`

**Request:**

```json
{
  "contactInfo": {
    "phone": "(555) 999-0000",
    "email": "hello@homadvisory.com",
    "address": "456 New Address, Bangalore"
  },
  "tagline": "YOUR TRUSTED REAL ESTATE PARTNER"
}
```

**Response (200):** Full updated settings object.

**Implementation Note:**

```php
public function update(Request $request)
{
    $settings = SiteSetting::firstOrCreate(['id' => 1], ['data' => []]);
    $current  = $settings->data ?? [];
    $merged   = array_replace_recursive($current, $request->all());
    $settings->update(['data' => $merged]);

    return response()->json($merged);
}
```

### 3.4 Migration Sample

```php
Schema::create('site_settings', function (Blueprint $table) {
    $table->id();
    $table->json('data');
    $table->timestamps();
});
```

---

## 4. Permission Requirements

### 4.1 Roles

| Role      | Description                                              |
|-----------|----------------------------------------------------------|
| `admin`   | Full access — all modules, user management, site settings |
| `manager` | Access to content and lead management, no settings        |
| `sales`   | Dashboard and leads only                                  |

### 4.2 Endpoint → Role Matrix

| Endpoint                          | Public | Sales | Manager | Admin |
|-----------------------------------|--------|-------|---------|-------|
| `POST /api/leads`                 | Yes    | —     | —       | —     |
| `GET /api/settings`               | Yes    | —     | —       | —     |
| `GET /api/admin/leads`            | —      | Yes   | Yes     | Yes   |
| `GET /api/admin/leads/{id}`       | —      | Yes   | Yes     | Yes   |
| `PUT /api/admin/leads/{id}`       | —      | Yes   | Yes     | Yes   |
| `DELETE /api/admin/leads/{id}`    | —      | No    | Yes     | Yes   |
| `POST /api/admin/leads/{id}/notes`| —      | Yes   | Yes     | Yes   |
| `GET /api/admin/users`            | —      | No    | No      | Yes   |
| `POST /api/admin/users`           | —      | No    | No      | Yes   |
| `PUT /api/admin/users/{id}`       | —      | No    | No      | Yes   |
| `DELETE /api/admin/users/{id}`    | —      | No    | No      | Yes   |
| `PUT /api/admin/settings`         | —      | No    | No      | Yes   |

### 4.3 Laravel Route Definitions

```php
// routes/api.php

// Public routes
Route::post('/leads', [LeadController::class, 'store']);
Route::get('/settings', [SiteSettingController::class, 'index']);

// Authenticated admin routes
Route::middleware('auth:sanctum')->prefix('admin')->group(function () {

    // Leads — accessible by admin, manager, sales
    Route::apiResource('leads', AdminLeadController::class);
    Route::post('leads/{lead}/notes', [LeadNoteController::class, 'store']);

    // Users — admin only
    Route::middleware('role:admin')->group(function () {
        Route::apiResource('users', AdminUserController::class);
        Route::put('settings', [SiteSettingController::class, 'update']);
    });
});
```

### 4.4 Role Middleware

```php
// app/Http/Middleware/CheckRole.php

class CheckRole
{
    public function handle(Request $request, Closure $next, string ...$roles)
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, $roles)) {
            return response()->json(['message' => 'Forbidden.'], 403);
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

---

### Common Error Responses

| Status | Meaning                | Body Example                                        |
|--------|------------------------|-----------------------------------------------------|
| 401    | Unauthenticated        | `{ "message": "Unauthenticated." }`                |
| 403    | Forbidden (wrong role) | `{ "message": "Forbidden." }`                      |
| 404    | Resource not found     | `{ "message": "Lead not found." }`                 |
| 422    | Validation failed      | `{ "message": "...", "errors": { "field": [...] }}` |
| 500    | Server error           | `{ "message": "Server Error." }`                   |
