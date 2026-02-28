# API Documentation — Properties Module

> Backend API specification for the Properties module.
> Covers database design, CRUD endpoints, filtering, SEO, and visit tracking.

---

## 1. DATABASE DESIGN

### 1.1 Properties Table (Core Fields)

| Column             | Type                | Constraints                        |
|--------------------|---------------------|------------------------------------|
| id                 | BIGINT UNSIGNED     | PK, AUTO_INCREMENT                 |
| title              | VARCHAR(255)        | NOT NULL                           |
| slug               | VARCHAR(255)        | NOT NULL, UNIQUE INDEX             |
| type               | ENUM('sale','rent') | NOT NULL, DEFAULT 'sale'           |
| property_type      | VARCHAR(50)         | NOT NULL (apartment, villa, plot…) |
| category           | VARCHAR(50)         | NOT NULL (apartment, villa, plot, builder-floor, penthouse, house, pg, studio, co-living) |
| status             | VARCHAR(30)         | NOT NULL (ready-to-move, under-construction, pre-launch) |
| publish_status     | ENUM('draft','published') | DEFAULT 'draft'             |
| price              | BIGINT UNSIGNED     | NOT NULL                           |
| price_unit         | VARCHAR(20)         | DEFAULT 'onwards'                  |
| developer          | VARCHAR(255)        | NULLABLE                           |
| description        | TEXT                | NULLABLE                           |
| highlights         | JSON                | NULLABLE — string array            |
| configuration      | JSON                | NOT NULL — e.g. ["2 BHK","3 BHK"] |
| location_area      | VARCHAR(255)        | NOT NULL                           |
| location_city      | VARCHAR(100)        | NOT NULL                           |
| location_state     | VARCHAR(100)        | NULLABLE                           |
| location_lat       | DECIMAL(10,7)       | NULLABLE                           |
| location_lng       | DECIMAL(10,7)       | NULLABLE                           |
| location_address   | VARCHAR(500)        | NULLABLE                           |
| dimension_min      | INT UNSIGNED        | NULLABLE                           |
| dimension_max      | INT UNSIGNED        | NULLABLE                           |
| dimension_unit     | VARCHAR(10)         | DEFAULT 'sqft'                     |
| possession         | VARCHAR(100)        | NULLABLE                           |
| specifications     | JSON                | NULLABLE — {projectArea, totalUnits, launchDate, possessionDate, reraId, towers, floors, constructionType} |
| brochure_url       | VARCHAR(500)        | NULLABLE                           |
| floor_plan_pdf_url | VARCHAR(500)        | NULLABLE                           |
| sections           | JSON                | NOT NULL — section visibility flags |
| schema_markup      | JSON                | NULLABLE — JSON-LD for SEO         |
| tags               | JSON                | NULLABLE — e.g. ["featured","premium"] |
| is_active          | BOOLEAN             | DEFAULT true                       |
| created_at         | TIMESTAMP           | DEFAULT CURRENT_TIMESTAMP          |
| updated_at         | TIMESTAMP           | ON UPDATE CURRENT_TIMESTAMP        |

#### `sections` JSON Structure

Controls which UI sections are visible on the property detail page.

```json
{
  "overview": true,
  "details": true,
  "highlights": true,
  "amenities": true,
  "floorPlans": true,
  "finance": true,
  "location": true,
  "documents": true,
  "construction": true,
  "constructionSpecs": true,
  "developer": true,
  "faqs": true,
  "similar": true
}
```

#### `tags` Array — Featured Logic

Properties with `"featured"` in the `tags` array appear on the homepage featured section.

```sql
-- Query featured properties
SELECT * FROM properties
WHERE is_active = 1
  AND JSON_CONTAINS(tags, '"featured"')
ORDER BY updated_at DESC;
```

---

### 1.2 Related Tables

#### amenities

| Column      | Type             | Constraints               |
|-------------|------------------|---------------------------|
| id          | BIGINT UNSIGNED  | PK                        |
| property_id | BIGINT UNSIGNED | FK → properties.id, CASCADE |
| icon        | VARCHAR(100)     | NOT NULL (mdi icon name)  |
| name        | VARCHAR(100)     | NOT NULL                  |
| category    | VARCHAR(30)      | NOT NULL (sports, leisure, fitness, safety, convenience) |

#### floor_plans

| Column      | Type             | Constraints               |
|-------------|------------------|---------------------------|
| id          | BIGINT UNSIGNED  | PK                        |
| property_id | BIGINT UNSIGNED | FK → properties.id, CASCADE |
| config      | VARCHAR(30)      | NOT NULL (e.g. "3 BHK")  |
| area        | VARCHAR(50)      | NOT NULL (e.g. "1650 sqft") |
| price       | BIGINT UNSIGNED  | NULLABLE                  |
| image       | VARCHAR(500)     | NULLABLE                  |
| bedrooms    | TINYINT UNSIGNED | NULLABLE                  |
| bathrooms   | TINYINT UNSIGNED | NULLABLE                  |

#### gallery

| Column      | Type             | Constraints               |
|-------------|------------------|---------------------------|
| id          | BIGINT UNSIGNED  | PK                        |
| property_id | BIGINT UNSIGNED | FK → properties.id, CASCADE |
| url         | VARCHAR(500)     | NOT NULL                  |
| sort_order  | INT UNSIGNED     | DEFAULT 0                 |

#### nearby_places

| Column      | Type             | Constraints               |
|-------------|------------------|---------------------------|
| id          | BIGINT UNSIGNED  | PK                        |
| property_id | BIGINT UNSIGNED | FK → properties.id, CASCADE |
| name        | VARCHAR(200)     | NOT NULL                  |
| distance    | VARCHAR(50)      | NOT NULL                  |
| type        | VARCHAR(30)      | NOT NULL (school, hospital, shopping, transport, workplace, restaurant, park, bank, landmark, entertainment) |

#### documents

| Column      | Type             | Constraints               |
|-------------|------------------|---------------------------|
| id          | BIGINT UNSIGNED  | PK                        |
| property_id | BIGINT UNSIGNED | FK → properties.id, CASCADE |
| name        | VARCHAR(200)     | NOT NULL                  |
| icon        | VARCHAR(100)     | DEFAULT 'mdi:file-document' |
| url         | VARCHAR(500)     | NULLABLE                  |

#### specialities

| Column      | Type             | Constraints               |
|-------------|------------------|---------------------------|
| id          | BIGINT UNSIGNED  | PK                        |
| property_id | BIGINT UNSIGNED | FK → properties.id, CASCADE |
| icon        | VARCHAR(100)     | NOT NULL                  |
| name        | VARCHAR(100)     | NOT NULL                  |
| description | VARCHAR(500)     | NULLABLE                  |

#### construction_specs

| Column      | Type             | Constraints               |
|-------------|------------------|---------------------------|
| id          | BIGINT UNSIGNED  | PK                        |
| property_id | BIGINT UNSIGNED | FK → properties.id, CASCADE |
| category    | VARCHAR(30)      | NOT NULL (flooring, doors, structure, electrical, plumbing, others) |
| area        | VARCHAR(100)     | NOT NULL                  |
| spec        | TEXT             | NOT NULL                  |

#### construction_timeline

| Column      | Type             | Constraints               |
|-------------|------------------|---------------------------|
| id          | BIGINT UNSIGNED  | PK                        |
| property_id | BIGINT UNSIGNED | FK → properties.id, CASCADE |
| label       | VARCHAR(100)     | NOT NULL                  |
| status      | VARCHAR(20)      | NOT NULL (pending, in-progress, completed) |
| icon        | VARCHAR(100)     | NULLABLE                  |
| sort_order  | INT UNSIGNED     | DEFAULT 0                 |

#### developer_info

| Column      | Type             | Constraints               |
|-------------|------------------|---------------------------|
| id          | BIGINT UNSIGNED  | PK                        |
| property_id | BIGINT UNSIGNED | FK → properties.id, UNIQUE, CASCADE |
| name        | VARCHAR(255)     | NOT NULL                  |
| description | TEXT             | NULLABLE                  |
| logo        | VARCHAR(500)     | NULLABLE                  |
| stats       | JSON             | NULLABLE — [{value, suffix, label, icon}] |

#### faqs

| Column      | Type             | Constraints               |
|-------------|------------------|---------------------------|
| id          | BIGINT UNSIGNED  | PK                        |
| property_id | BIGINT UNSIGNED | FK → properties.id, CASCADE |
| question    | VARCHAR(500)     | NOT NULL                  |
| answer      | TEXT             | NOT NULL                  |
| sort_order  | INT UNSIGNED     | DEFAULT 0                 |

#### similar_properties (pivot)

| Column              | Type             | Constraints               |
|---------------------|------------------|---------------------------|
| property_id         | BIGINT UNSIGNED  | FK → properties.id, CASCADE |
| similar_property_id | BIGINT UNSIGNED  | FK → properties.id, CASCADE |
| PRIMARY KEY         | (property_id, similar_property_id) |          |

---

### 1.3 Example Laravel Migration

```php
// database/migrations/xxxx_create_properties_table.php

Schema::create('properties', function (Blueprint $table) {
    $table->id();
    $table->string('title');
    $table->string('slug')->unique();
    $table->enum('type', ['sale', 'rent'])->default('sale');
    $table->string('property_type', 50);
    $table->string('category', 50);
    $table->string('status', 30)->default('pre-launch');
    $table->enum('publish_status', ['draft', 'published'])->default('draft');
    $table->unsignedBigInteger('price');
    $table->string('price_unit', 20)->default('onwards');
    $table->string('developer')->nullable();
    $table->text('description')->nullable();
    $table->json('highlights')->nullable();
    $table->json('configuration');
    $table->string('location_area');
    $table->string('location_city', 100);
    $table->string('location_state', 100)->nullable();
    $table->decimal('location_lat', 10, 7)->nullable();
    $table->decimal('location_lng', 10, 7)->nullable();
    $table->string('location_address', 500)->nullable();
    $table->unsignedInteger('dimension_min')->nullable();
    $table->unsignedInteger('dimension_max')->nullable();
    $table->string('dimension_unit', 10)->default('sqft');
    $table->string('possession', 100)->nullable();
    $table->json('specifications')->nullable();
    $table->string('brochure_url', 500)->nullable();
    $table->string('floor_plan_pdf_url', 500)->nullable();
    $table->json('sections');
    $table->json('schema_markup')->nullable();
    $table->json('tags')->nullable();
    $table->boolean('is_active')->default(true);
    $table->timestamps();

    $table->index('type');
    $table->index('status');
    $table->index('category');
    $table->index('location_city');
    $table->index('is_active');
    $table->index('price');
});

Schema::create('amenities', function (Blueprint $table) {
    $table->id();
    $table->foreignId('property_id')->constrained()->cascadeOnDelete();
    $table->string('icon', 100);
    $table->string('name', 100);
    $table->string('category', 30);
});

Schema::create('floor_plans', function (Blueprint $table) {
    $table->id();
    $table->foreignId('property_id')->constrained()->cascadeOnDelete();
    $table->string('config', 30);
    $table->string('area', 50);
    $table->unsignedBigInteger('price')->nullable();
    $table->string('image', 500)->nullable();
    $table->unsignedTinyInteger('bedrooms')->nullable();
    $table->unsignedTinyInteger('bathrooms')->nullable();
});

Schema::create('gallery', function (Blueprint $table) {
    $table->id();
    $table->foreignId('property_id')->constrained()->cascadeOnDelete();
    $table->string('url', 500);
    $table->unsignedInteger('sort_order')->default(0);
});

Schema::create('nearby_places', function (Blueprint $table) {
    $table->id();
    $table->foreignId('property_id')->constrained()->cascadeOnDelete();
    $table->string('name', 200);
    $table->string('distance', 50);
    $table->string('type', 30);
});

Schema::create('documents', function (Blueprint $table) {
    $table->id();
    $table->foreignId('property_id')->constrained()->cascadeOnDelete();
    $table->string('name', 200);
    $table->string('icon', 100)->default('mdi:file-document');
    $table->string('url', 500)->nullable();
});

Schema::create('specialities', function (Blueprint $table) {
    $table->id();
    $table->foreignId('property_id')->constrained()->cascadeOnDelete();
    $table->string('icon', 100);
    $table->string('name', 100);
    $table->string('description', 500)->nullable();
});

Schema::create('construction_specs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('property_id')->constrained()->cascadeOnDelete();
    $table->string('category', 30);
    $table->string('area', 100);
    $table->text('spec');
});

Schema::create('construction_timeline', function (Blueprint $table) {
    $table->id();
    $table->foreignId('property_id')->constrained()->cascadeOnDelete();
    $table->string('label', 100);
    $table->string('status', 20)->default('pending');
    $table->string('icon', 100)->nullable();
    $table->unsignedInteger('sort_order')->default(0);
});

Schema::create('developer_info', function (Blueprint $table) {
    $table->id();
    $table->foreignId('property_id')->unique()->constrained()->cascadeOnDelete();
    $table->string('name');
    $table->text('description')->nullable();
    $table->string('logo', 500)->nullable();
    $table->json('stats')->nullable();
});

Schema::create('faqs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('property_id')->constrained()->cascadeOnDelete();
    $table->string('question', 500);
    $table->text('answer');
    $table->unsignedInteger('sort_order')->default(0);
});

Schema::create('similar_properties', function (Blueprint $table) {
    $table->foreignId('property_id')->constrained()->cascadeOnDelete();
    $table->unsignedBigInteger('similar_property_id');
    $table->foreign('similar_property_id')->references('id')->on('properties')->cascadeOnDelete();
    $table->primary(['property_id', 'similar_property_id']);
});
```

---

## 2. PROPERTY CRUD ENDPOINTS

### 2.1 Public Endpoints

#### GET /api/properties

List all active properties with pagination.

**Query Parameters:** See [Section 3 — Filtering & Search](#3-filtering--search).

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "title": "Nambiar District 25 Phase 2",
      "slug": "nambiar-district-25-phase-2",
      "type": "sale",
      "propertyType": "apartment",
      "category": "apartment",
      "status": "ready-to-move",
      "price": 12400000,
      "priceUnit": "onwards",
      "developer": "Nambiar Builders",
      "location": {
        "area": "Dommasandra, Sarjapur Road",
        "city": "Bangalore",
        "state": "Karnataka",
        "lat": 12.9058,
        "lng": 77.6854
      },
      "configuration": ["2 BHK", "3 BHK", "4 BHK"],
      "dimensionRange": { "min": 1245, "max": 2990, "unit": "sqft" },
      "possession": "Ready to Move",
      "tags": ["featured", "premium"],
      "gallery": ["https://...image1.jpg"],
      "isActive": true,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2026-02-27T16:35:19Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 42,
    "last_page": 3
  }
}
```

**Notes:**
- Only returns `is_active = true` by default.
- List endpoint returns core fields only (no nested relations).
- Use `?include=amenities,floorPlans` for eager loading if needed.

---

#### GET /api/properties/{id}

Full property detail by ID.

**Response:** Full property object with all nested relations:

```json
{
  "id": 1,
  "title": "Nambiar District 25 Phase 2",
  "slug": "nambiar-district-25-phase-2",
  "type": "sale",
  "propertyType": "apartment",
  "category": "apartment",
  "status": "ready-to-move",
  "publishStatus": "published",
  "price": 12400000,
  "priceUnit": "onwards",
  "developer": "Nambiar Builders",
  "description": "Premium residential project...",
  "highlights": ["Prime location", "Ready to move"],
  "location": {
    "area": "Dommasandra, Sarjapur Road",
    "city": "Bangalore",
    "state": "Karnataka",
    "lat": 12.9058,
    "lng": 77.6854
  },
  "configuration": ["2 BHK", "3 BHK", "4 BHK"],
  "dimensionRange": { "min": 1245, "max": 2990, "unit": "sqft" },
  "possession": "Ready to Move",
  "specifications": {
    "projectArea": "15 acres",
    "totalUnits": 750,
    "launchDate": "2021-06-15",
    "possessionDate": "2024-12-01",
    "reraId": "PRM/KA/RERA/...",
    "towers": 8,
    "floors": 14,
    "constructionType": "RCC framed structure"
  },
  "amenities": [
    { "icon": "mdi:swim", "name": "Swimming Pool", "category": "leisure" }
  ],
  "floorPlans": [
    { "config": "2 BHK", "area": "1245 sqft", "price": 12400000, "image": "...", "bedrooms": 2, "bathrooms": 2 }
  ],
  "gallery": ["https://...image1.jpg", "https://...image2.jpg"],
  "nearbyPlaces": [
    { "name": "Wipro Corporate Office", "distance": "3 km", "type": "workplace" }
  ],
  "documents": [
    { "name": "RERA Certificate", "icon": "mdi:file-document-check", "url": "" }
  ],
  "specialities": [
    { "icon": "mdi:shield-star", "name": "RERA Approved", "description": "Fully compliant" }
  ],
  "constructionSpecs": {
    "flooring": [{ "area": "Living Room", "spec": "Italian marble" }],
    "doors": [{ "area": "Main Door", "spec": "Teak wood frame" }],
    "structure": [{ "area": "Foundation", "spec": "RCC framed" }],
    "electrical": [{ "area": "Wiring", "spec": "Concealed copper" }]
  },
  "constructionTimeline": [
    { "label": "Foundation", "status": "completed", "icon": "mdi:shovel" },
    { "label": "Structure", "status": "in-progress", "icon": "mdi:crane" }
  ],
  "developerInfo": {
    "name": "Nambiar Builders",
    "description": "20+ years...",
    "logo": "https://...",
    "stats": [{ "value": "20", "suffix": "+", "label": "Years Experience", "icon": "mdi:calendar-star" }]
  },
  "faqs": [
    { "question": "Is this RERA approved?", "answer": "Yes..." }
  ],
  "similarPropertyIds": [2, 3, 5],
  "sections": {
    "overview": true,
    "details": true,
    "highlights": true,
    "amenities": true,
    "floorPlans": true,
    "finance": true,
    "location": true,
    "documents": true,
    "construction": true,
    "constructionSpecs": true,
    "developer": true,
    "faqs": true,
    "similar": true
  },
  "tags": ["featured", "premium"],
  "seoTitle": "Nambiar District 25 Phase 2 | Bangalore",
  "seoDescription": "Explore Nambiar District 25...",
  "seoKeywords": ["nambiar district 25"],
  "canonicalUrl": "https://homadvisory.com/properties/nambiar-district-25-phase-2",
  "ogTitle": "Nambiar District 25 Phase 2 | Bangalore",
  "ogDescription": "Explore Nambiar District 25...",
  "ogImage": "https://...image.jpg",
  "twitterCard": "summary_large_image",
  "schemaMarkup": "{...JSON-LD...}",
  "brochureUrl": "",
  "floorPlanPdfUrl": "",
  "isActive": true,
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2026-02-27T16:35:19Z"
}
```

---

#### GET /api/properties/slug/{slug}

Fetch single property by slug. Same response as GET by ID.

**Laravel Controller:**

```php
public function showBySlug(string $slug)
{
    return Property::where('slug', $slug)
        ->where('is_active', true)
        ->with([
            'amenities', 'floorPlans', 'gallery', 'nearbyPlaces',
            'documents', 'specialities', 'constructionSpecs',
            'constructionTimeline', 'developerInfo', 'faqs',
        ])
        ->firstOrFail();
}
```

---

### 2.2 Admin Endpoints

All admin endpoints require `auth:sanctum` middleware.

#### POST /api/admin/properties

**Required Fields:**

| Field          | Validation                                  |
|----------------|---------------------------------------------|
| title          | required, string, max:255                   |
| slug           | required, string, max:255, unique:properties |
| type           | required, in:sale,rent                      |
| property_type  | required, string, max:50                    |
| category       | required, string, max:50                    |
| status         | required, in:ready-to-move,under-construction,pre-launch |
| price          | required, integer, min:0                    |
| configuration  | required, array, min:1                      |
| location.area  | required, string                            |
| location.city  | required, string                            |

**Optional Fields:**

| Field              | Validation                              |
|--------------------|-----------------------------------------|
| publish_status     | in:draft,published                      |
| price_unit         | string, max:20                          |
| developer          | string, max:255                         |
| description        | string                                  |
| highlights         | array of strings                        |
| location.state     | string                                  |
| location.lat       | numeric, between:-90,90                 |
| location.lng       | numeric, between:-180,180               |
| dimension_min      | integer, min:0                          |
| dimension_max      | integer, min:0, gte:dimension_min       |
| possession         | string, max:100                         |
| specifications     | json object                             |
| sections           | json object (boolean flags)             |
| tags               | array of strings                        |
| amenities          | array of {icon, name, category}         |
| floorPlans         | array of {config, area, price?, image?} |
| gallery            | array of URL strings                    |
| nearbyPlaces       | array of {name, distance, type}         |
| documents          | array of {name, icon?, url?}            |
| specialities       | array of {icon, name, description?}     |
| constructionSpecs  | object {flooring[], doors[], structure[], electrical[]} |
| constructionTimeline | array of {label, status, icon?}       |
| developerInfo      | object {name, description?, logo?, stats[]} |
| faqs               | array of {question, answer}             |
| similarPropertyIds | array of integer IDs                    |
| seoTitle           | string, max:70                          |
| seoDescription     | string, max:160                         |
| seoKeywords        | array of strings                        |
| schemaMarkup       | json string                             |
| is_active          | boolean                                 |

**Response:** `201 Created` — full property object.

---

#### PUT /api/admin/properties/{id}

Same validation as POST, but all fields are optional. Slug must remain unique (excluding current record).

**Validation for slug on update:**

```php
'slug' => ['sometimes', 'string', 'max:255', Rule::unique('properties')->ignore($id)],
```

**Response:** `200 OK` — updated property object.

---

#### DELETE /api/admin/properties/{id}

Soft-delete or hard-delete with cascade.

**Response:**

```json
{ "message": "Property deleted successfully" }
```

---

## 3. FILTERING & SEARCH

### 3.1 Supported Query Parameters

| Param          | Type    | Description                                |
|----------------|---------|--------------------------------------------|
| type           | string  | `sale` or `rent`                           |
| category       | string  | `apartment`, `villa`, `plot`, etc.         |
| status         | string  | `ready-to-move`, `under-construction`, `pre-launch` |
| city           | string  | Filter by `location_city`                  |
| area           | string  | Filter by `location_area` (partial match)  |
| minPrice       | integer | Minimum price (inclusive)                  |
| maxPrice       | integer | Maximum price (inclusive)                  |
| configuration  | string  | Comma-separated: `2 BHK,3 BHK` — matches JSON_CONTAINS |
| featured       | boolean | If `true`, filter where tags contains "featured" |
| q              | string  | Full-text search on title, area, city, developer |
| sort           | string  | `newest`, `price-asc`, `price-desc`, `possession` |
| page           | integer | Page number (default: 1)                   |
| per_page       | integer | Items per page (default: 15, max: 50)      |

### 3.2 Example Queries

```
GET /api/properties?type=sale&city=Bangalore&minPrice=5000000&maxPrice=20000000&sort=price-asc&page=1&per_page=15

GET /api/properties?status=ready-to-move&configuration=2 BHK,3 BHK&featured=true

GET /api/properties?q=sarjapur&category=apartment&sort=newest
```

### 3.3 Pagination Response Format

```json
{
  "data": [ ... ],
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 42,
    "last_page": 3
  },
  "links": {
    "first": "/api/properties?page=1",
    "last": "/api/properties?page=3",
    "prev": null,
    "next": "/api/properties?page=2"
  }
}
```

### 3.4 Sort Mapping

| Frontend Value | SQL ORDER BY                                |
|----------------|---------------------------------------------|
| newest         | `created_at DESC`                           |
| price-asc      | `price ASC`                                 |
| price-desc     | `price DESC`                                |
| possession     | `possession ASC`                            |

### 3.5 Recommended DB Indexes

```sql
-- Core filter indexes (already in migration)
CREATE INDEX idx_properties_type ON properties(type);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_category ON properties(category);
CREATE INDEX idx_properties_city ON properties(location_city);
CREATE INDEX idx_properties_active ON properties(is_active);
CREATE INDEX idx_properties_price ON properties(price);

-- Composite indexes for common filter combinations
CREATE INDEX idx_properties_active_type ON properties(is_active, type);
CREATE INDEX idx_properties_active_city_price ON properties(is_active, location_city, price);
CREATE INDEX idx_properties_active_status ON properties(is_active, status);

-- Full-text index for search
ALTER TABLE properties ADD FULLTEXT idx_ft_search (title, developer, location_area, location_city);
```

### 3.6 Laravel Controller — Filter Example

```php
public function index(Request $request)
{
    $query = Property::where('is_active', true);

    if ($type = $request->input('type')) {
        $query->where('type', $type);
    }
    if ($category = $request->input('category')) {
        $query->where('category', $category);
    }
    if ($status = $request->input('status')) {
        $query->where('status', $status);
    }
    if ($city = $request->input('city')) {
        $query->where('location_city', $city);
    }
    if ($area = $request->input('area')) {
        $query->where('location_area', 'LIKE', "%{$area}%");
    }
    if ($min = $request->input('minPrice')) {
        $query->where('price', '>=', (int) $min);
    }
    if ($max = $request->input('maxPrice')) {
        $query->where('price', '<=', (int) $max);
    }
    if ($config = $request->input('configuration')) {
        foreach (explode(',', $config) as $c) {
            $query->whereJsonContains('configuration', trim($c));
        }
    }
    if ($request->boolean('featured')) {
        $query->whereJsonContains('tags', 'featured');
    }
    if ($q = $request->input('q')) {
        $query->whereFullText(['title', 'developer', 'location_area', 'location_city'], $q);
    }

    // Sort
    match ($request->input('sort')) {
        'price-asc'  => $query->orderBy('price', 'asc'),
        'price-desc' => $query->orderBy('price', 'desc'),
        'possession' => $query->orderBy('possession', 'asc'),
        default      => $query->orderBy('created_at', 'desc'),
    };

    $perPage = min((int) $request->input('per_page', 15), 50);

    return $query->paginate($perPage);
}
```

---

## 4. SEO MODULE

### 4.1 Storage Strategy

SEO data is stored in a separate `seo_properties` table with a one-to-one relationship to `properties`.

| Column           | Type             | Constraints                     |
|------------------|------------------|---------------------------------|
| id               | BIGINT UNSIGNED  | PK                              |
| property_id      | BIGINT UNSIGNED  | FK → properties.id, UNIQUE      |
| meta_title       | VARCHAR(70)      | NULLABLE                        |
| meta_description | VARCHAR(160)     | NULLABLE                        |
| keywords         | JSON             | NULLABLE — string array         |
| canonical_url    | VARCHAR(500)     | NULLABLE                        |
| og_title         | VARCHAR(100)     | NULLABLE                        |
| og_description   | VARCHAR(200)     | NULLABLE                        |
| og_image         | VARCHAR(500)     | NULLABLE                        |
| twitter_card     | VARCHAR(30)      | DEFAULT 'summary_large_image'   |
| schema_json      | JSON             | NULLABLE — JSON-LD structured data |
| seo_score        | TINYINT UNSIGNED | DEFAULT 0                       |
| created_at       | TIMESTAMP        |                                 |
| updated_at       | TIMESTAMP        |                                 |

### 4.2 JSON-LD Handling

The `schema_json` column stores structured data as a JSON column. The frontend reads it and injects it into `<script type="application/ld+json">`.

Supported schema types:
- `RealEstateListing` — property listing details
- `BreadcrumbList` — navigation breadcrumbs
- `Residence` — fallback for simpler listings

The backend stores raw JSON; no server-side rendering of JSON-LD into HTML.

### 4.3 Endpoints

#### GET /api/seo/properties

List all properties with their SEO data (paginated).

```json
{
  "data": [
    {
      "id": 1,
      "property_id": 1,
      "meta_title": "Nambiar District 25 Phase 2 | Bangalore",
      "meta_description": "Explore Nambiar District 25...",
      "keywords": ["nambiar district 25"],
      "seo_score": 85,
      "property": {
        "id": 1,
        "title": "Nambiar District 25 Phase 2",
        "slug": "nambiar-district-25-phase-2"
      }
    }
  ],
  "meta": { "current_page": 1, "per_page": 25, "total": 42 }
}
```

#### GET /api/seo/property/{id}

Fetch SEO data for a single property.

#### PUT /api/seo/property/{id}

Update SEO data for a property.

**Validation Rules:**

| Field            | Rule                                       |
|------------------|--------------------------------------------|
| meta_title       | nullable, string, max:70                   |
| meta_description | nullable, string, max:160                  |
| keywords         | nullable, array                            |
| keywords.*       | string, max:50                             |
| canonical_url    | nullable, url, max:500                     |
| og_title         | nullable, string, max:100                  |
| og_description   | nullable, string, max:200                  |
| og_image         | nullable, url, max:500                     |
| twitter_card     | nullable, in:summary,summary_large_image   |
| schema_json      | nullable, json                             |

**Response:** Updated SEO record with recalculated `seo_score`.

#### POST /api/seo/auto-generate

Auto-generate SEO fields for a property based on its content.

**Request:**

```json
{ "property_id": 1 }
```

**Response:** Generated SEO record.

### 4.4 Suggested Controller Structure

```php
class SeoController extends Controller
{
    public function index()
    {
        return SeoProperty::with('property:id,title,slug,location_area,location_city,developer')
            ->paginate(25);
    }

    public function show($id)
    {
        return SeoProperty::where('property_id', $id)
            ->with('property')
            ->firstOrFail();
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'meta_title'       => 'nullable|string|max:70',
            'meta_description' => 'nullable|string|max:160',
            'keywords'         => 'nullable|array',
            'keywords.*'       => 'string|max:50',
            'canonical_url'    => 'nullable|url|max:500',
            'og_title'         => 'nullable|string|max:100',
            'og_description'   => 'nullable|string|max:200',
            'og_image'         => 'nullable|url|max:500',
            'twitter_card'     => 'nullable|in:summary,summary_large_image',
            'schema_json'      => 'nullable|json',
        ]);

        $seo = SeoProperty::updateOrCreate(
            ['property_id' => $id],
            $validated
        );

        $seo->seo_score = $this->calculateScore($seo);
        $seo->save();

        return $seo->load('property');
    }

    public function autoGenerate(Request $request)
    {
        $property = Property::findOrFail($request->input('property_id'));

        $generated = [
            'meta_title'       => Str::limit("{$property->title} by {$property->developer} | {$property->location_city}", 70),
            'meta_description' => Str::limit("Explore {$property->title} in {$property->location_area}, {$property->location_city}. " . implode(', ', $property->configuration ?? []) . " from {$property->dimension_min}-{$property->dimension_max} sqft.", 160),
            'keywords'         => $this->generateKeywords($property),
            'canonical_url'    => "https://homadvisory.com/properties/{$property->slug}",
            'og_title'         => Str::limit("{$property->title} by {$property->developer} | {$property->location_city}", 100),
            'og_description'   => Str::limit("Explore {$property->title} in {$property->location_area}.", 200),
            'og_image'         => $property->gallery()->orderBy('sort_order')->value('url'),
            'twitter_card'     => 'summary_large_image',
        ];

        $seo = SeoProperty::updateOrCreate(
            ['property_id' => $property->id],
            $generated
        );

        return $seo->load('property');
    }

    private function calculateScore(SeoProperty $seo): int
    {
        $score = 0;
        if ($seo->meta_title)       $score += 15;
        if ($seo->meta_description) $score += 15;
        if (!empty($seo->keywords)) $score += 10;
        if ($seo->canonical_url)    $score += 10;
        if ($seo->og_title)         $score += 10;
        if ($seo->og_description)   $score += 10;
        if ($seo->og_image)         $score += 10;
        if ($seo->twitter_card)     $score += 5;
        if ($seo->schema_json)      $score += 15;
        return $score;
    }
}
```

### 4.5 Routes

```php
Route::middleware('auth:sanctum')->prefix('seo')->group(function () {
    Route::get('/properties',          [SeoController::class, 'index']);
    Route::get('/property/{id}',       [SeoController::class, 'show']);
    Route::put('/property/{id}',       [SeoController::class, 'update']);
    Route::post('/auto-generate',      [SeoController::class, 'autoGenerate']);
    Route::post('/bulk-auto-generate', [SeoController::class, 'bulkAutoGenerate']);
});
```

---

## 5. VISIT TRACKING

### 5.1 Endpoint

#### POST /api/visits

Records a visitor session. Non-blocking — should never cause frontend errors.

**Request:**

```json
{
  "visitor_id": "550e8400-e29b-41d4-a716-446655440000",
  "page": "/properties/nambiar-district-25-phase-2",
  "referrer": "https://google.com",
  "user_agent": "Mozilla/5.0..."
}
```

**Response:**

```json
{ "recorded": true }
```

or (deduplicated):

```json
{ "recorded": false }
```

### 5.2 Deduplication Logic (30-min Rule)

1. Client generates a `visitor_id` (UUID) and stores it in `localStorage`.
2. On page load, client checks `sessionStorage` for last visit timestamp.
3. If last visit was < 30 min ago, skip the API call.
4. Server double-checks: query `visits` table for same `visitor_id` within the last 30 minutes.
5. If a recent record exists, return `{ "recorded": false }` without inserting.

### 5.3 Visits Table

```php
Schema::create('visits', function (Blueprint $table) {
    $table->id();
    $table->string('visitor_id', 64)->index();
    $table->string('session_id', 64)->nullable()->index();
    $table->ipAddress('ip_address')->nullable();
    $table->string('page', 500)->nullable();
    $table->string('referrer', 500)->nullable();
    $table->string('user_agent', 500)->nullable();
    $table->string('device_type', 20)->nullable();   // desktop, mobile, tablet
    $table->string('country', 2)->nullable();
    $table->timestamp('visited_at')->useCurrent()->index();

    // Composite index for dedup query
    $table->index(['visitor_id', 'visited_at']);
});
```

### 5.4 Controller

```php
class VisitController extends Controller
{
    public function store(Request $request)
    {
        $visitorId = $request->input('visitor_id');

        // Dedup: skip if same visitor visited in last 30 min
        $recent = Visit::where('visitor_id', $visitorId)
            ->where('visited_at', '>=', now()->subMinutes(30))
            ->exists();

        if ($recent) {
            return response()->json(['recorded' => false], 200);
        }

        Visit::create([
            'visitor_id'  => $visitorId,
            'session_id'  => Str::random(32),
            'ip_address'  => $request->ip(),
            'page'        => Str::limit($request->input('page', '/'), 500),
            'referrer'    => Str::limit($request->input('referrer'), 500),
            'user_agent'  => Str::limit($request->input('user_agent'), 500),
            'device_type' => $this->detectDevice($request->userAgent()),
            'visited_at'  => now(),
        ]);

        return response()->json(['recorded' => true], 201);
    }

    private function detectDevice(?string $ua): string
    {
        if (!$ua) return 'desktop';
        if (preg_match('/mobile/i', $ua)) return 'mobile';
        if (preg_match('/tablet|ipad/i', $ua)) return 'tablet';
        return 'desktop';
    }
}
```

### 5.5 Daily Aggregation

Pre-aggregate stats for fast dashboard queries.

```php
Schema::create('visit_daily_stats', function (Blueprint $table) {
    $table->id();
    $table->date('date')->unique();
    $table->unsignedInteger('unique_visitors')->default(0);
    $table->unsignedInteger('total_visits')->default(0);
    $table->unsignedInteger('mobile_visits')->default(0);
    $table->unsignedInteger('desktop_visits')->default(0);
    $table->timestamps();
});
```

**Scheduled Command** — runs daily at 02:00 AM:

```php
// app/Console/Commands/AggregateVisitStats.php

$date = Carbon::yesterday();

VisitDailyStat::updateOrCreate(
    ['date' => $date->toDateString()],
    [
        'unique_visitors' => Visit::whereDate('visited_at', $date)
            ->distinct('visitor_id')->count('visitor_id'),
        'total_visits'    => Visit::whereDate('visited_at', $date)->count(),
        'mobile_visits'   => Visit::whereDate('visited_at', $date)
            ->where('device_type', 'mobile')->count(),
        'desktop_visits'  => Visit::whereDate('visited_at', $date)
            ->where('device_type', 'desktop')->count(),
    ]
);
```

**Dashboard Query:**

```php
// Last 30 days unique visitors
$visits = VisitDailyStat::where('date', '>=', now()->subDays(30))
    ->sum('unique_visitors');
```
