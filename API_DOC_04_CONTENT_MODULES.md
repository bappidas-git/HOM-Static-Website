# API Documentation — Content Modules

> Backend API reference for Articles, FAQs, Neighborhoods, Partners, and Newsletter.
> All endpoints assume Laravel + MySQL with Sanctum authentication for admin routes.

---

## Table of Contents

1. [Articles](#1-articles)
2. [FAQs](#2-faqs)
3. [Neighborhoods](#3-neighborhoods)
4. [Partners](#4-partners)
5. [Newsletter](#5-newsletter)

---

## 1. Articles

### Data Model

| Field            | Type        | Required | Description                                |
|------------------|-------------|----------|--------------------------------------------|
| id               | bigint (PK) | auto     | Primary key                                |
| title            | string(255) | yes      | Article title                              |
| slug             | string(255) | unique   | URL-safe identifier, auto-generated        |
| excerpt          | text        | yes      | Short summary for listing cards            |
| content          | longText    | yes      | Full article body (supports Markdown)      |
| image            | string(500) | no       | Cover image URL                            |
| category         | string(50)  | yes      | Must match category enum                   |
| tags             | json        | no       | Array of tag strings                       |
| author           | string(150) | yes      | Author display name                        |
| readTime         | integer     | no       | Estimated read time in minutes             |
| publishedAt      | timestamp   | no       | Publish date; null = draft                 |
| isActive         | boolean     | yes      | `true` = published, `false` = draft/hidden |
| isTrending       | boolean     | no       | Marks article for trending section         |
| trendingOrder    | integer     | no       | Sort position in trending list (nullable)  |
| seoTitle         | string(255) | no       | Custom SEO title                           |
| seoDescription   | string(500) | no       | Custom meta description                    |
| created_at       | timestamp   | auto     | Laravel timestamp                          |
| updated_at       | timestamp   | auto     | Laravel timestamp                          |

### Slug Generation

Slugs are derived from the title at creation time:

```
Title:  "Premium Apartments in Mumbai: Top 5 Luxury Towers"
Slug:   "premium-apartments-mumbai-top-luxury-towers"
```

**Rules:**
- Lowercase the title
- Strip special characters (`:`, `'`, `"`, etc.)
- Replace spaces with hyphens
- Collapse consecutive hyphens
- Append `-2`, `-3`, etc. if the slug already exists

**Laravel helper:**

```php
use Illuminate\Support\Str;

$slug = Str::slug($request->title);
$original = $slug;
$counter = 2;
while (Article::where('slug', $slug)->exists()) {
    $slug = $original . '-' . $counter++;
}
```

### Category Enum

| Value           | Label            |
|-----------------|------------------|
| market-trends   | Market Trends    |
| buying-guide    | Buying Guide     |
| investment      | Investment       |
| legal           | Legal            |
| interior        | Interior Design  |

Validate with `Rule::in()`:

```php
'category' => ['required', Rule::in([
    'market-trends', 'buying-guide', 'investment', 'legal', 'interior'
])],
```

### Endpoints

---

#### GET /api/articles

Returns all active articles, sorted by `publishedAt` descending.

**Query Parameters:**

| Param    | Type    | Default | Description                     |
|----------|---------|---------|---------------------------------|
| page     | integer | 1       | Page number                     |
| per_page | integer | 15      | Items per page                  |
| category | string  | —       | Filter by category enum value   |
| q        | string  | —       | Search title, excerpt, content  |

**Response (200):**

```json
{
  "data": [
    {
      "id": 1,
      "title": "Premium Apartments in Mumbai: Top 5 Luxury Towers",
      "slug": "premium-apartments-mumbai-top-luxury-towers",
      "excerpt": "Discover the most exclusive luxury apartment towers in Mumbai...",
      "image": "https://example.com/images/mumbai-towers.jpg",
      "category": "market-trends",
      "tags": ["mumbai", "luxury", "apartments", "investment"],
      "author": "H.O.M Advisory Team",
      "readTime": 6,
      "publishedAt": "2025-12-01T10:00:00Z",
      "isActive": true,
      "isTrending": true,
      "trendingOrder": 1
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 3,
    "per_page": 15,
    "total": 35
  }
}
```

**Notes:**
- Public endpoint; no auth required.
- Only returns `isActive: true` articles by default.
- Sorted by `publishedAt` DESC.

---

#### GET /api/articles/{id}

Returns a single article by primary key.

**Response (200):**

```json
{
  "id": 1,
  "title": "Premium Apartments in Mumbai: Top 5 Luxury Towers",
  "slug": "premium-apartments-mumbai-top-luxury-towers",
  "excerpt": "Discover the most exclusive luxury apartment towers in Mumbai...",
  "content": "Mumbai has always been the epicenter of luxury real estate...",
  "image": "https://example.com/images/mumbai-towers.jpg",
  "category": "market-trends",
  "tags": ["mumbai", "luxury", "apartments", "investment"],
  "author": "H.O.M Advisory Team",
  "readTime": 6,
  "publishedAt": "2025-12-01T10:00:00Z",
  "isActive": true,
  "isTrending": true,
  "trendingOrder": 1,
  "seoTitle": "Top 5 Luxury Apartment Towers in Mumbai | H.O.M Advisory",
  "seoDescription": "Explore Mumbai's most premium luxury apartment towers."
}
```

**Error (404):**

```json
{ "message": "Article not found." }
```

---

#### GET /api/articles/slug/{slug}

Look up an article by its slug. Used for public-facing article pages.

**Example:** `GET /api/articles/slug/premium-apartments-mumbai-top-luxury-towers`

**Response:** Same shape as GET /api/articles/{id}.

---

#### GET /api/articles/category/{category}

Returns active articles filtered by category.

**Example:** `GET /api/articles/category/market-trends`

**Response:** Same paginated shape as GET /api/articles.

**Error (422):**

```json
{ "message": "Invalid category. Allowed: market-trends, buying-guide, investment, legal, interior." }
```

---

#### GET /api/articles/trending

Returns active articles where `isTrending = true`, sorted by `trendingOrder` ASC.

**Response (200):**

```json
{
  "data": [
    {
      "id": 1,
      "title": "Premium Apartments in Mumbai: Top 5 Luxury Towers",
      "slug": "premium-apartments-mumbai-top-luxury-towers",
      "excerpt": "Discover the most exclusive luxury apartment towers in Mumbai...",
      "image": "https://example.com/images/mumbai-towers.jpg",
      "category": "market-trends",
      "author": "H.O.M Advisory Team",
      "readTime": 6,
      "isTrending": true,
      "trendingOrder": 1
    }
  ]
}
```

**Notes:**
- Not paginated — trending list is small by design.
- Items with `null` trendingOrder sort to the end.

---

#### POST /api/admin/articles

Create a new article. Requires admin auth.

**Headers:** `Authorization: Bearer {token}`

**Request Body:**

```json
{
  "title": "North Bangalore: India's Fastest Growing Corridor",
  "excerpt": "North Bangalore is witnessing unprecedented growth...",
  "content": "North Bangalore has emerged as the most promising...",
  "image": "https://example.com/images/north-blr.jpg",
  "category": "market-trends",
  "tags": ["north-bangalore", "investment", "airport"],
  "author": "H.O.M Advisory Team",
  "readTime": 8,
  "publishedAt": "2025-12-20T10:00:00Z",
  "isActive": true,
  "isTrending": false,
  "trendingOrder": null,
  "seoTitle": "North Bangalore Real Estate | H.O.M Advisory",
  "seoDescription": "Why investors are bullish on North Bangalore."
}
```

**Validation:**

| Field          | Rules                                                          |
|----------------|----------------------------------------------------------------|
| title          | required, string, max:255                                      |
| excerpt        | required, string                                               |
| content        | required, string                                               |
| image          | nullable, url, max:500                                         |
| category       | required, in:market-trends,buying-guide,investment,legal,interior |
| tags           | nullable, array                                                |
| tags.*         | string, max:50                                                 |
| author         | required, string, max:150                                      |
| readTime       | nullable, integer, min:1                                       |
| publishedAt    | nullable, date                                                 |
| isActive       | required, boolean                                              |
| isTrending     | nullable, boolean                                              |
| trendingOrder  | nullable, integer, min:1                                       |
| seoTitle       | nullable, string, max:255                                      |
| seoDescription | nullable, string, max:500                                      |

**Response (201):** Full article object with generated `id` and `slug`.

---

#### PUT /api/admin/articles/{id}

Update an existing article. Requires admin auth.

**Headers:** `Authorization: Bearer {token}`

**Request Body:** Same as POST (all fields optional; partial update supported).

**Response (200):** Updated article object.

**Notes:**
- If `title` changes and slug auto-generation is enabled, the slug is regenerated.
- Consider keeping the old slug as a redirect to avoid broken links.

---

#### DELETE /api/admin/articles/{id}

Delete an article. Requires admin auth.

**Headers:** `Authorization: Bearer {token}`

**Response (200):**

```json
{ "message": "Article deleted successfully." }
```

---

### Migration

```php
Schema::create('articles', function (Blueprint $table) {
    $table->id();
    $table->string('title', 255);
    $table->string('slug', 255)->unique();
    $table->text('excerpt');
    $table->longText('content');
    $table->string('image', 500)->nullable();
    $table->string('category', 50)->index();
    $table->json('tags')->nullable();
    $table->string('author', 150);
    $table->unsignedTinyInteger('read_time')->nullable();
    $table->timestamp('published_at')->nullable()->index();
    $table->boolean('is_active')->default(false)->index();
    $table->boolean('is_trending')->default(false)->index();
    $table->unsignedSmallInteger('trending_order')->nullable();
    $table->string('seo_title', 255)->nullable();
    $table->string('seo_description', 500)->nullable();
    $table->timestamps();
});
```

---

## 2. FAQs

### Data Model

| Field    | Type        | Required | Description                        |
|----------|-------------|----------|------------------------------------|
| id       | bigint (PK) | auto     | Primary key                        |
| question | string(500) | yes      | The FAQ question                   |
| answer   | text        | yes      | The FAQ answer                     |
| category | string(50)  | yes      | Must match category enum           |
| order    | integer     | yes      | Sort position within category      |
| isActive | boolean     | yes      | `true` = visible, `false` = hidden |

### Category Enum

| Value    | Label   |
|----------|---------|
| general  | General |
| buying   | Buying  |
| selling  | Selling |
| renting  | Renting |
| legal    | Legal   |
| finance  | Finance |

### Endpoints

---

#### GET /api/faqs

Returns all active FAQs, sorted by `order` ASC.

**Query Parameters:**

| Param    | Type   | Description            |
|----------|--------|------------------------|
| category | string | Filter by category     |

**Response (200):**

```json
{
  "data": [
    {
      "id": 1,
      "question": "What is the buying process?",
      "answer": "The buying process involves: 1) Property search...",
      "category": "buying",
      "order": 1,
      "isActive": true
    },
    {
      "id": 3,
      "question": "What documents do I need to buy a property?",
      "answer": "To buy a property in India, you typically need...",
      "category": "buying",
      "order": 2,
      "isActive": true
    }
  ]
}
```

**Notes:**
- Public endpoint; no auth required.
- Only returns `isActive: true` by default.
- Sorted by `order` ASC.

---

#### GET /api/faqs/category/{category}

Returns active FAQs for a specific category, sorted by `order` ASC.

**Example:** `GET /api/faqs/category/buying`

**Response:** Same shape as GET /api/faqs, filtered to the given category.

**Error (422):**

```json
{ "message": "Invalid category. Allowed: general, buying, selling, renting, legal, finance." }
```

---

#### POST /api/admin/faqs

Create a new FAQ. Requires admin auth.

**Headers:** `Authorization: Bearer {token}`

**Request Body:**

```json
{
  "question": "How do I schedule a property viewing?",
  "answer": "You can schedule a property viewing by clicking the 'Schedule Visit' button...",
  "category": "general",
  "order": 4,
  "isActive": true
}
```

**Validation:**

| Field    | Rules                                                       |
|----------|-------------------------------------------------------------|
| question | required, string, max:500                                   |
| answer   | required, string                                            |
| category | required, in:general,buying,selling,renting,legal,finance   |
| order    | required, integer, min:0                                    |
| isActive | required, boolean                                           |

**Response (201):** Full FAQ object with generated `id`.

---

#### PUT /api/admin/faqs/{id}

Update an existing FAQ. Requires admin auth.

**Headers:** `Authorization: Bearer {token}`

**Request Body:** Same as POST (partial update supported).

**Response (200):** Updated FAQ object.

---

#### DELETE /api/admin/faqs/{id}

Delete a FAQ. Requires admin auth.

**Headers:** `Authorization: Bearer {token}`

**Response (200):**

```json
{ "message": "FAQ deleted successfully." }
```

---

### Migration

```php
Schema::create('faqs', function (Blueprint $table) {
    $table->id();
    $table->string('question', 500);
    $table->text('answer');
    $table->string('category', 50)->index();
    $table->unsignedSmallInteger('order')->default(0);
    $table->boolean('is_active')->default(true)->index();
    $table->timestamps();
});
```

---

## 3. Neighborhoods

### Data Model

| Field         | Type        | Required | Description                             |
|---------------|-------------|----------|-----------------------------------------|
| id            | bigint (PK) | auto     | Primary key                             |
| name          | string(150) | yes      | Neighborhood name                       |
| image         | string(500) | no       | Display image URL                       |
| propertyCount | integer     | no       | Number of listed properties in the area |
| city          | string(100) | yes      | City the neighborhood belongs to        |
| isActive      | boolean     | yes      | `true` = shown on site                  |

### Active/Inactive Logic

- `isActive: true` — Neighborhood appears on the public website (homepage cards, filters).
- `isActive: false` — Hidden from public views, still accessible in admin panel.
- The `getActive` service method filters by `isActive: true` for public endpoints.

### Endpoints

---

#### GET /api/neighborhoods

Returns all neighborhoods (admin use — includes inactive).

**Response (200):**

```json
{
  "data": [
    {
      "id": 1,
      "name": "Electronic City",
      "image": "https://example.com/images/electronic-city.jpg",
      "propertyCount": 1,
      "city": "Bangalore",
      "isActive": true
    },
    {
      "id": 4,
      "name": "Whitefield",
      "image": "https://example.com/images/whitefield.jpg",
      "propertyCount": 95,
      "city": "Bangalore",
      "isActive": true
    }
  ]
}
```

---

#### GET /api/neighborhoods/active

Returns only active neighborhoods. Used by public-facing pages.

**Response (200):**

```json
{
  "data": [
    {
      "id": 4,
      "name": "Whitefield",
      "image": "https://example.com/images/whitefield.jpg",
      "propertyCount": 95,
      "city": "Bangalore",
      "isActive": true
    }
  ]
}
```

**Notes:**
- Public endpoint; no auth required.
- Filters: `isActive = true`.

---

#### POST /api/admin/neighborhoods

Create a new neighborhood. Requires admin auth.

**Headers:** `Authorization: Bearer {token}`

**Request Body:**

```json
{
  "name": "Sarjapur Road",
  "image": "https://example.com/images/sarjapur.jpg",
  "propertyCount": 67,
  "city": "Bangalore",
  "isActive": true
}
```

**Validation:**

| Field         | Rules                       |
|---------------|-----------------------------|
| name          | required, string, max:150   |
| image         | nullable, url, max:500      |
| propertyCount | nullable, integer, min:0    |
| city          | required, string, max:100   |
| isActive      | required, boolean           |

**Response (201):** Full neighborhood object with generated `id`.

---

#### PUT /api/admin/neighborhoods/{id}

Update an existing neighborhood. Requires admin auth.

**Headers:** `Authorization: Bearer {token}`

**Request Body:** Same as POST (partial update supported).

**Response (200):** Updated neighborhood object.

---

#### DELETE /api/admin/neighborhoods/{id}

Delete a neighborhood. Requires admin auth.

**Headers:** `Authorization: Bearer {token}`

**Response (200):**

```json
{ "message": "Neighborhood deleted successfully." }
```

---

### Migration

```php
Schema::create('neighborhoods', function (Blueprint $table) {
    $table->id();
    $table->string('name', 150);
    $table->string('image', 500)->nullable();
    $table->unsignedInteger('property_count')->default(0);
    $table->string('city', 100)->index();
    $table->boolean('is_active')->default(true)->index();
    $table->timestamps();
});
```

---

## 4. Partners

### Data Model

| Field    | Type        | Required | Description                           |
|----------|-------------|----------|---------------------------------------|
| id       | bigint (PK) | auto     | Primary key                           |
| name     | string(150) | yes      | Partner / developer name              |
| logo     | string(500) | yes      | Logo image URL                        |
| website  | string(500) | no       | Partner website URL                   |
| isActive | boolean     | yes      | `true` = shown on site                |
| order    | integer     | yes      | Display sort position                 |

### Active/Inactive Logic

- `isActive: true` — Partner logo appears on public pages.
- `isActive: false` — Hidden from public views, retained in admin.
- Results sorted by `order` ASC (both `getAll` and `getActive`).

### Endpoints

---

#### GET /api/partners

Returns all partners sorted by `order` ASC (admin use — includes inactive).

**Response (200):**

```json
{
  "data": [
    {
      "id": 1,
      "name": "Prestige",
      "logo": "https://example.com/logos/prestige.png",
      "website": "https://www.prestigeconstructions.com",
      "isActive": true,
      "order": 1
    },
    {
      "id": 2,
      "name": "Brigade",
      "logo": "https://example.com/logos/brigade.png",
      "website": "https://www.brigadegroup.com",
      "isActive": true,
      "order": 2
    }
  ]
}
```

---

#### GET /api/partners/active

Returns only active partners, sorted by `order` ASC. Used by public-facing pages.

**Response (200):** Same shape as GET /api/partners, filtered to `isActive: true`.

**Notes:**
- Public endpoint; no auth required.

---

#### POST /api/admin/partners

Create a new partner. Requires admin auth.

**Headers:** `Authorization: Bearer {token}`

**Request Body:**

```json
{
  "name": "Godrej",
  "logo": "https://example.com/logos/godrej.png",
  "website": "https://www.godrejproperties.com",
  "isActive": true,
  "order": 4
}
```

**Validation:**

| Field    | Rules                       |
|----------|-----------------------------|
| name     | required, string, max:150   |
| logo     | required, url, max:500      |
| website  | nullable, url, max:500      |
| isActive | required, boolean           |
| order    | required, integer, min:0    |

**Response (201):** Full partner object with generated `id`.

---

#### PUT /api/admin/partners/{id}

Update an existing partner. Requires admin auth.

**Headers:** `Authorization: Bearer {token}`

**Request Body:** Same as POST (partial update supported).

**Response (200):** Updated partner object.

---

#### DELETE /api/admin/partners/{id}

Delete a partner. Requires admin auth.

**Headers:** `Authorization: Bearer {token}`

**Response (200):**

```json
{ "message": "Partner deleted successfully." }
```

---

### Migration

```php
Schema::create('partners', function (Blueprint $table) {
    $table->id();
    $table->string('name', 150);
    $table->string('logo', 500);
    $table->string('website', 500)->nullable();
    $table->boolean('is_active')->default(true)->index();
    $table->unsignedSmallInteger('order')->default(0);
    $table->timestamps();
});
```

---

## 5. Newsletter

### Data Model

| Field         | Type        | Required | Description                    |
|---------------|-------------|----------|--------------------------------|
| id            | bigint (PK) | auto     | Primary key                    |
| email         | string(255) | yes      | Subscriber email (unique)      |
| subscribed_at | timestamp   | auto     | When the subscription occurred |
| is_active     | boolean     | auto     | Default `true`; set `false` to unsubscribe |

### Endpoints

---

#### POST /api/newsletter/subscribe

Subscribe an email to the newsletter.

**Request Body:**

```json
{
  "email": "buyer@example.com"
}
```

**Validation:**

| Field | Rules                                          |
|-------|------------------------------------------------|
| email | required, email, max:255, unique:newsletter_subscribers,email |

**Email Validation Details:**
- Must be a valid RFC-compliant email address.
- Must be unique — duplicate subscriptions return a `409 Conflict`.
- Optionally apply DNS validation (`dns` rule) to reject fake domains.

**Response (201) — New subscription:**

```json
{
  "message": "Successfully subscribed.",
  "email": "buyer@example.com",
  "subscribed_at": "2025-12-20T14:30:00Z"
}
```

**Response (409) — Already subscribed:**

```json
{
  "message": "This email is already subscribed."
}
```

**Response (422) — Validation error:**

```json
{
  "message": "The email field must be a valid email address.",
  "errors": {
    "email": ["The email field must be a valid email address."]
  }
}
```

---

### Migration

```php
Schema::create('newsletter_subscribers', function (Blueprint $table) {
    $table->id();
    $table->string('email', 255)->unique();
    $table->timestamp('subscribed_at')->useCurrent();
    $table->boolean('is_active')->default(true);
    $table->timestamps();
});
```

### Controller Snippet

```php
class NewsletterController extends Controller
{
    public function subscribe(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email:rfc,dns', 'max:255'],
        ]);

        $existing = NewsletterSubscriber::where('email', $request->email)->first();

        if ($existing) {
            if ($existing->is_active) {
                return response()->json([
                    'message' => 'This email is already subscribed.',
                ], 409);
            }

            // Re-activate a previously unsubscribed email
            $existing->update(['is_active' => true, 'subscribed_at' => now()]);
            return response()->json([
                'message' => 'Successfully re-subscribed.',
                'email'   => $existing->email,
                'subscribed_at' => $existing->subscribed_at,
            ], 201);
        }

        $subscriber = NewsletterSubscriber::create([
            'email'         => $request->email,
            'subscribed_at' => now(),
        ]);

        return response()->json([
            'message'       => 'Successfully subscribed.',
            'email'         => $subscriber->email,
            'subscribed_at' => $subscriber->subscribed_at,
        ], 201);
    }
}
```

---

## Error Response Format

All endpoints follow a consistent error format:

```json
{
  "message": "Human-readable error description.",
  "errors": {
    "field_name": ["Specific validation error."]
  }
}
```

| Status | Meaning                |
|--------|------------------------|
| 200    | Success                |
| 201    | Created                |
| 401    | Unauthorized (no/expired token) |
| 403    | Forbidden (insufficient role)   |
| 404    | Resource not found     |
| 409    | Conflict (duplicate)   |
| 422    | Validation error       |
| 500    | Server error           |

---

## Authentication

All `/api/admin/*` routes require a valid Sanctum bearer token:

```
Authorization: Bearer {token}
```

Tokens are obtained via `POST /api/auth/login` (see API_DOC_02). On `401` response, the frontend clears stored auth data and redirects to `/admin/login`.

---

## Pagination Format

Paginated endpoints return Laravel's standard pagination envelope:

```json
{
  "data": [ ... ],
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 15,
    "total": 72
  }
}
```

The frontend `normalizeListResponse()` helper handles both flat arrays (JSON Server) and `{ data: [] }` paginated responses (Laravel).
