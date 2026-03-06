# Property Editing Backend Requirements

## Overview

This document details all backend API contract inconsistencies discovered during an audit of the property editing system. The frontend admin panel (`PropertyForm.jsx`) currently relies on extensive normalization logic to handle unreliable, inconsistent responses from the backend API. This creates fragile code, hard-to-debug data loss, and a poor developer experience.

The goal of this document is to define a **single, consistent API contract** so that the frontend can consume property data without fallback field mappings, multi-key normalization, or data transformations.

---

## Current API Problems

### Problem 1 — Inconsistent Response Wrapper Structure

**Description:** Different GET endpoints return property data in different wrapper structures. Some return the object directly, some wrap it in `{ data: {...} }`, and the list endpoint may return a raw array or a paginated `{ data: [...], meta: {...} }` object.

**Example responses observed:**

```json
// GET /api/properties/{id} — sometimes:
{ "id": 1, "title": "..." }

// GET /api/properties/{id} — other times:
{ "data": { "id": 1, "title": "..." } }

// GET /api/properties — sometimes:
[ { "id": 1 }, { "id": 2 } ]

// GET /api/properties — other times:
{ "data": [ { "id": 1 }, { "id": 2 } ], "current_page": 1, "total": 50 }
```

**Why it breaks frontend:** The frontend must check `data?.data`, `Array.isArray(data)`, `data.items`, etc. on every response (see `normalizeListResponse` and `getById` in `api.js:66-84, 378-384`). If the backend changes its wrapping without notice, data fails to load silently.

---

### Problem 2 — Field Naming Inconsistencies (snake_case vs camelCase)

**Description:** The backend inconsistently uses snake_case and camelCase for the same fields across different endpoints or even within the same response. The frontend must check multiple variants for every field.

**Examples:**

| Concept | Variants found in API responses |
|---|---|
| Property type | `propertyType`, `property_type` |
| Publish status | `publishStatus`, `publish_status` |
| Price unit | `priceUnit`, `price_unit` |
| Active flag | `isActive`, `is_active` |
| Brochure URL | `brochureUrl`, `brochure_url` |
| Floor plan PDF | `floorPlanPdfUrl`, `floor_plan_pdf_url` |
| Created date | `createdAt`, `created_at` |
| Updated date | `updatedAt`, `updated_at` |

**Why it breaks frontend:** The normalization layer (`normalizePropertyResponse` in `api.js:213-368`) must handle both `data.propertyType || data.property_type` for every single field. If a new variant appears, the frontend silently loses data.

---

### Problem 3 — Specifications Returned in Multiple Formats

**Description:** The `specifications` field is returned in different formats depending on the endpoint or how the property was saved:

**Format 1 — Array of objects (expected):**
```json
"specifications": [
  { "key": "Project Area", "value": "8 acres", "icon": "mdi:map-marker-radius" },
  { "key": "RERA ID", "value": "PRM/KA/123", "icon": "mdi:certificate" }
]
```

**Format 2 — Plain object (key-value pairs, no icons):**
```json
"specifications": {
  "Project Area": "8 acres",
  "RERA ID": "PRM/KA/123"
}
```

**Format 3 — Object with nested values:**
```json
"specifications": {
  "Project Area": { "value": "8 acres", "icon": "mdi:map-marker-radius" }
}
```

Additionally, the field name itself varies: `specifications`, `details`, `property_details`, `specs`.

The icon field name also varies: `icon`, `icon_name`, `iconify`, `spec_icon`.

**Why it breaks frontend:** The frontend runs a complex normalization pipeline (`api.js:253-272`) that handles all three formats plus four different field name variants. If any new format appears, icon data or specification values may be silently lost.

---

### Problem 4 — Floor Plan Field Name and Schema Inconsistencies

**Description:** Floor plan data uses inconsistent field names across responses:

| Concept | Variants |
|---|---|
| Container field | `floorPlans`, `floor_plans`, `floorPlan`, `floor_plan` |
| Configuration | `config`, `configuration`, `name`, `title`, `type` |
| Area | `area`, `carpet_area`, `super_area` |
| Price | `price`, `base_price`, `total_price` |
| Image | `image`, `image_url`, `floor_image`, `plan_image` |
| Bedrooms | `bedrooms`, `bed_count`, `bhk` |
| Bathrooms | `bathrooms`, `bath_count` |

**Why it breaks frontend:** The floor plan normalizer (`normalizeFloorPlanItem` in `api.js:200-210`) must chain 3-5 fallback field names for every single property. If a new variant is introduced, floor plan data will appear blank in the form.

---

### Problem 5 — SEO Data Split Across Multiple Sources

**Description:** SEO data may come from three different locations:

1. **Inline on property object:** `property.meta_title`, `property.meta_description`, etc.
2. **Nested under `seo` key:** `property.seo.meta_title`, `property.seo.title`, etc.
3. **Separate endpoint:** `GET /seo/property/{id}` returns its own object with yet another set of field names.

The SEO field names also vary across these sources:

| Concept | Variants |
|---|---|
| Title | `seoTitle`, `meta_title`, `seo_title`, `title` (nested) |
| Description | `seoDescription`, `meta_description`, `seo_description`, `description` (nested) |
| Keywords | `seoKeywords`, `keywords`, `seo_keywords` |
| Canonical URL | `canonicalUrl`, `canonical_url` |
| OG Title | `ogTitle`, `og_title` |
| OG Description | `ogDescription`, `og_description` |
| OG Image | `ogImage`, `og_image` |
| Twitter Card | `twitterCard`, `twitter_card` |
| Schema Markup | `schemaMarkup`, `schema_markup` |

**Why it breaks frontend:** The frontend must:
1. Fetch from two endpoints in parallel (`getById` + `getSeo`)
2. Check 3-4 field name variants per SEO field
3. Merge and deduplicate data from both sources
4. Handle the `seo` nested object vs flat fields

This is the most fragile part of the data loading (see `PropertyForm.jsx:75-126`). SEO data is frequently lost or shows as blank because one source returns data under a field name the frontend doesn't check.

---

### Problem 6 — Gallery Format Inconsistency

**Description:** The gallery field sometimes returns a flat array of URL strings and sometimes returns an array of objects:

**Format 1 — String array (expected):**
```json
"gallery": ["https://example.com/img1.jpg", "https://example.com/img2.jpg"]
```

**Format 2 — Object array:**
```json
"gallery": [
  { "url": "https://example.com/img1.jpg", "alt": "Front view" },
  { "image": "https://example.com/img2.jpg" }
]
```

**Why it breaks frontend:** The normalization code must handle both (`api.js:242-247`). If a new object shape appears (e.g., `{ src: "..." }`), images will silently disappear.

---

### Problem 7 — Location Data Format Inconsistency

**Description:** Location data comes in two formats:

**Format 1 — Nested object:**
```json
"location": {
  "area": "Whitefield",
  "city": "Bangalore",
  "state": "Karnataka",
  "lat": 12.9716,
  "lng": 77.5946
}
```

**Format 2 — Flat snake_case fields:**
```json
"location_area": "Whitefield",
"location_city": "Bangalore",
"location_state": "Karnataka",
"location_lat": 12.9716,
"location_lng": 77.5946
```

Sometimes `location` is returned as a string or null, breaking object destructuring.

**Why it breaks frontend:** The frontend checks if `location` is an object, a string, null, or an array (`api.js:217-228`) and falls back to flat fields. This adds unnecessary complexity.

---

### Problem 8 — Relation Arrays Use Mixed Naming Conventions

**Description:** Nested relation arrays (camelCase in frontend) may arrive with snake_case names:

| Expected (camelCase) | Also received as (snake_case) |
|---|---|
| `nearbyPlaces` | `nearby_places` |
| `constructionSpecs` | `construction_specs` |
| `constructionTimeline` | `construction_timeline` |
| `developerInfo` | `developer_info` |
| `similarPropertyIds` | `similar_property_ids` |
| `specialities` | `specialties` (alternate spelling) |

**Why it breaks frontend:** Each field requires a fallback check (`api.js:280-295`). The `specialities`/`specialties` spelling inconsistency is particularly error-prone.

---

### Problem 9 — Keywords Field Type Inconsistency

**Description:** The `keywords` (SEO) field is sometimes returned as an array and sometimes as a comma-separated string:

```json
// Array format:
"keywords": ["luxury", "apartment", "bangalore"]

// String format:
"keywords": "luxury, apartment, bangalore"
```

**Why it breaks frontend:** The frontend must parse strings into arrays (`api.js:335-340`), adding fragile splitting logic that can break on unusual delimiters.

---

### Problem 10 — Dimension Range Format Inconsistency

**Description:** Similar to location, dimension data comes in both nested and flat formats:

**Nested:** `{ dimensionRange: { min, max, unit } }` or `{ dimension_range: { min, max, unit } }`

**Flat:** `{ dimension_min, dimension_max, dimension_unit }`

**Why it breaks frontend:** The normalization must check both (`api.js:231-239`).

---

### Problem 11 — Boolean Field Type Inconsistency

**Description:** Boolean fields like `is_active` are sometimes returned as actual booleans, sometimes as integers (0/1), and sometimes as strings ("true"/"false").

**Why it breaks frontend:** The frontend must use double-negation coercion: `!!(data.isActive ?? data.is_active)` (`api.js:323`).

---

### Problem 12 — Schema Markup Type Inconsistency

**Description:** The `schema_markup` field is sometimes returned as a JSON string and sometimes as a parsed JSON object.

**Why it breaks frontend:** The frontend must check the type and stringify objects (`api.js:326-331`). If the user edits and saves, the backend may receive a double-encoded string.

---

### Problem 13 — No Standardized Error Response Format

**Description:** Error responses vary:
- `{ "message": "Not found" }`
- `{ "error": "Not found" }`
- `{ "errors": { "title": ["Title is required"] } }` (validation)
- Plain text error strings

**Why it breaks frontend:** Error handling must check multiple response shapes (`PropertyForm.jsx:641-653`).

---

### Problem 14 — GET and PUT Schema Mismatch

**Description:** The GET endpoints return data in a format that cannot be directly sent back to PUT. Key mismatches:

| GET returns | PUT expects |
|---|---|
| `property_type: "apartment"` | `property_type: "apartment"` (OK) |
| `location: { area, city }` (object) | `location_area`, `location_city` (flat) |
| `dimensionRange: { min, max }` (object) | `dimension_min`, `dimension_max` (flat) |
| `seoTitle: "..."` (camelCase) | `meta_title: "..."` (different name) |
| `isActive: true` (camelCase) | `is_active: true` (snake_case) |
| `floorPlans` (camelCase) | `floorPlans` (camelCase — OK but inconsistent with other fields) |

**Why it breaks frontend:** The entire `buildPayload()` function (`PropertyForm.jsx:477-579`) and `transformPropertyPayload()` (`api.js:90-186`) exist solely to convert GET response format to PUT request format. This is ~190 lines of transformation code that shouldn't be necessary.

---

## Required Backend Fixes

### Fix 1 — Standardize Response Wrapper

**Endpoints:** All property endpoints

**Change required:** Use a consistent wrapper for all responses:

```json
// Single resource:
{ "data": { ... }, "message": "Success" }

// List/paginated:
{ "data": [ ... ], "meta": { "current_page": 1, "per_page": 15, "total": 50, "last_page": 4 } }
```

**Expected behavior:** Every endpoint always wraps the payload in `{ data: ... }`. The frontend should be able to safely access `response.data.data` for single resources and `response.data.data` as an array for lists.

---

### Fix 2 — Use Consistent snake_case for All Fields

**Endpoints:** All property endpoints (GET, POST, PUT)

**Change required:** Standardize on **snake_case** for all field names in both request and response payloads. This matches Laravel conventions and database column naming.

**Key renames:**

| Current (mixed) | Standard (snake_case) |
|---|---|
| `propertyType` | `property_type` |
| `publishStatus` | `publish_status` |
| `priceUnit` | `price_unit` |
| `isActive` | `is_active` |
| `brochureUrl` | `brochure_url` |
| `floorPlanPdfUrl` | `floor_plan_pdf_url` |
| `floorPlans` | `floor_plans` |
| `nearbyPlaces` | `nearby_places` |
| `constructionSpecs` | `construction_specs` |
| `constructionTimeline` | `construction_timeline` |
| `developerInfo` | `developer_info` |
| `similarPropertyIds` | `similar_property_ids` |
| `dimensionRange` | removed (use flat `dimension_min`, `dimension_max`, `dimension_unit`) |
| `seoTitle` | `meta_title` |
| `seoDescription` | `meta_description` |
| `seoKeywords` | `keywords` |
| `canonicalUrl` | `canonical_url` |
| `ogTitle` | `og_title` |
| `ogDescription` | `og_description` |
| `ogImage` | `og_image` |
| `twitterCard` | `twitter_card` |
| `schemaMarkup` | `schema_markup` |

---

### Fix 3 — Standardize Specifications as Array

**Endpoints:** All property GET/PUT endpoints

**Change required:** Always return and accept specifications as an array of `{ key, value, icon }` objects. Remove support for object format and alternate field names (`details`, `property_details`, `specs`).

**Expected schema:**
```json
"specifications": [
  { "key": "Project Area", "value": "8 acres", "icon": "mdi:map-marker-radius" },
  { "key": "RERA ID", "value": "PRM/KA/123", "icon": "mdi:certificate" }
]
```

The icon field must always be named `icon` (not `icon_name`, `iconify`, or `spec_icon`).

---

### Fix 4 — Standardize Floor Plan Schema

**Endpoints:** All property GET/PUT endpoints

**Change required:** Use a single consistent schema for floor plans:

```json
"floor_plans": [
  {
    "config": "2 BHK",
    "area": "1200",
    "price": "8500000",
    "bedrooms": "2",
    "bathrooms": "2",
    "image": "https://example.com/floor-plan.jpg"
  }
]
```

Remove support for alternate field names (`configuration`, `name`, `carpet_area`, `image_url`, `bed_count`, etc.).

---

### Fix 5 — Consolidate SEO Data into Property Response

**Endpoints:** `GET /api/properties/{id}`, `PUT /api/admin/properties/{id}`

**Change required:** Include SEO data directly in the property response under a nested `seo` object. The separate `/seo/property/{id}` endpoint can remain for backward compatibility but should return the same data.

**Expected schema:**
```json
{
  "data": {
    "id": 1,
    "title": "...",
    "seo": {
      "meta_title": "SEO Title Here",
      "meta_description": "SEO description here",
      "keywords": ["luxury", "apartment"],
      "canonical_url": "https://example.com/property/slug",
      "og_title": "OG Title",
      "og_description": "OG Description",
      "og_image": "https://example.com/og.jpg",
      "twitter_card": "summary_large_image",
      "schema_markup": "{}"
    }
  }
}
```

The PUT endpoint should accept SEO data in the same `seo` nested format and persist it, eliminating the need for a separate SEO update call.

---

### Fix 6 — Standardize Gallery as String Array

**Endpoints:** All property endpoints

**Change required:** Always return gallery as a flat array of URL strings:

```json
"gallery": [
  "https://example.com/img1.jpg",
  "https://example.com/img2.jpg"
]
```

If metadata (alt text, captions) is needed in the future, introduce a new `gallery_items` field rather than changing the gallery field type.

---

### Fix 7 — Standardize Location as Flat Fields

**Endpoints:** All property GET/PUT endpoints

**Change required:** Always return location as flat snake_case fields (matching the database columns):

```json
"location_area": "Whitefield",
"location_city": "Bangalore",
"location_state": "Karnataka",
"location_lat": 12.9716,
"location_lng": 77.5946,
"location_address": "123 Main Street"
```

Never return a nested `location` object. The PUT endpoint already accepts flat fields; the GET endpoints should match.

---

### Fix 8 — Standardize Keywords as Array

**Endpoints:** All property and SEO endpoints

**Change required:** Always return `keywords` as a JSON array, never as a comma-separated string:

```json
"keywords": ["luxury", "apartment", "bangalore"]
```

---

### Fix 9 — Standardize Boolean Fields

**Endpoints:** All property endpoints

**Change required:** Always return boolean fields as actual JSON booleans (`true`/`false`), not integers or strings:

```json
"is_active": true,
"publish_status": "published"
```

---

### Fix 10 — Standardize Schema Markup as String

**Endpoints:** All property and SEO endpoints

**Change required:** Always return `schema_markup` as a JSON string (not a parsed object):

```json
"schema_markup": "{\"@context\":\"https://schema.org\"}"
```

---

### Fix 11 — Standardize Error Responses

**Endpoints:** All endpoints

**Change required:** Use a consistent error response format:

```json
// Validation error (422):
{
  "message": "Validation failed",
  "errors": {
    "title": ["The title field is required."],
    "price": ["The price must be greater than 0."]
  }
}

// Not found (404):
{
  "message": "Property not found"
}

// Server error (500):
{
  "message": "Internal server error"
}
```

---

### Fix 12 — Ensure GET/PUT Schema Symmetry

**Endpoints:** `GET /api/properties/{id}`, `PUT /api/admin/properties/{id}`

**Change required:** The PUT endpoint must accept the **exact same field names and structure** that the GET endpoint returns. A client should be able to:

1. GET a property
2. Modify a field in the response
3. PUT the modified response back

Without any field renaming, restructuring, or transformation.

---

## Recommended Standard API Schema

Below is the proposed single unified schema that all property endpoints should follow:

```json
{
  "data": {
    "id": 1,
    "title": "Prestige Lakeside Habitat",
    "slug": "prestige-lakeside-habitat",
    "type": "sale",
    "property_type": "apartment",
    "category": "apartment",
    "status": "under-construction",
    "publish_status": "published",
    "is_active": true,

    "price": 8500000,
    "price_unit": "onwards",
    "developer": "Prestige Group",
    "description": "Luxury apartments in the heart of Bangalore...",
    "possession": "Dec 2026",

    "location_area": "Whitefield",
    "location_city": "Bangalore",
    "location_state": "Karnataka",
    "location_lat": 12.9716,
    "location_lng": 77.5946,
    "location_address": "Survey No. 123, Whitefield Main Road",

    "configuration": ["2 BHK", "3 BHK", "4 BHK"],

    "dimension_min": 1200,
    "dimension_max": 3500,
    "dimension_unit": "sqft",

    "highlights": [
      "RERA Approved",
      "Close to IT Hub",
      "Premium Amenities"
    ],

    "specifications": [
      {
        "key": "Project Area",
        "value": "8 acres",
        "icon": "mdi:map-marker-radius"
      },
      {
        "key": "Total Units",
        "value": "450",
        "icon": "mdi:home-group"
      },
      {
        "key": "RERA ID",
        "value": "PRM/KA/RERA/1251/309/AG/180713/001947",
        "icon": "mdi:certificate"
      }
    ],

    "amenities": [
      {
        "name": "Swimming Pool",
        "icon": "mdi:pool",
        "category": "leisure"
      },
      {
        "name": "Gymnasium",
        "icon": "mdi:dumbbell",
        "category": "fitness"
      }
    ],

    "floor_plans": [
      {
        "config": "2 BHK",
        "area": "1200",
        "price": "8500000",
        "bedrooms": "2",
        "bathrooms": "2",
        "image": "https://example.com/floor-2bhk.jpg"
      },
      {
        "config": "3 BHK",
        "area": "1800",
        "price": "12500000",
        "bedrooms": "3",
        "bathrooms": "3",
        "image": "https://example.com/floor-3bhk.jpg"
      }
    ],

    "gallery": [
      "https://example.com/cover.jpg",
      "https://example.com/exterior.jpg",
      "https://example.com/lobby.jpg"
    ],

    "nearby_places": [
      {
        "name": "International Tech Park",
        "distance": "3 km",
        "type": "workplace"
      },
      {
        "name": "Phoenix Marketcity",
        "distance": "5 km",
        "type": "shopping"
      }
    ],

    "documents": [
      {
        "name": "RERA Certificate",
        "icon": "mdi:file-document",
        "url": "https://example.com/rera-cert.pdf"
      }
    ],

    "specialities": [
      {
        "icon": "mdi:leaf",
        "name": "Eco-Friendly",
        "description": "Green building certified with sustainable materials"
      }
    ],

    "construction_specs": {
      "flooring": [
        { "area": "Living Room", "spec": "Italian marble flooring" },
        { "area": "Bedrooms", "spec": "Vitrified tiles" }
      ],
      "doors": [
        { "area": "Main Door", "spec": "Teak wood frame with laminate finish" }
      ],
      "structure": [
        { "area": "Foundation", "spec": "RCC framed structure" }
      ],
      "electrical": [
        { "area": "Wiring", "spec": "Concealed copper wiring" }
      ]
    },

    "construction_timeline": [
      {
        "label": "Foundation",
        "status": "completed",
        "icon": "mdi:shovel"
      },
      {
        "label": "Structure",
        "status": "in-progress",
        "icon": "mdi:crane"
      },
      {
        "label": "Finishing",
        "status": "pending",
        "icon": "mdi:format-paint"
      },
      {
        "label": "Handover",
        "status": "pending",
        "icon": "mdi:key-variant"
      }
    ],

    "developer_info": {
      "name": "Prestige Group",
      "description": "One of South India's leading real estate developers...",
      "logo": "https://example.com/prestige-logo.png",
      "stats": [
        {
          "value": 30,
          "suffix": "+",
          "label": "Years Experience",
          "icon": "mdi:calendar-star"
        },
        {
          "value": 250,
          "suffix": "+",
          "label": "Projects Completed",
          "icon": "mdi:office-building"
        }
      ]
    },

    "faqs": [
      {
        "question": "What is the possession date?",
        "answer": "Expected possession by December 2026."
      }
    ],

    "similar_property_ids": [2, 5, 8],

    "brochure_url": "https://example.com/brochure.pdf",
    "floor_plan_pdf_url": "https://example.com/floor-plans.pdf",

    "tags": ["featured", "premium"],

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

    "seo": {
      "meta_title": "Prestige Lakeside Habitat - Luxury Apartments in Whitefield",
      "meta_description": "Discover luxury apartments at Prestige Lakeside Habitat...",
      "keywords": ["prestige lakeside habitat", "whitefield apartments", "luxury homes bangalore"],
      "canonical_url": "https://homrealty.in/properties/prestige-lakeside-habitat",
      "og_title": "Prestige Lakeside Habitat | Premium Living in Whitefield",
      "og_description": "Discover luxury apartments at Prestige Lakeside Habitat...",
      "og_image": "https://example.com/cover.jpg",
      "twitter_card": "summary_large_image",
      "schema_markup": "{\"@context\":\"https://schema.org\",\"@type\":\"Residence\"}"
    },

    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-03-01T14:20:00Z"
  }
}
```

---

## Endpoint Consistency Requirements

### All GET endpoints must return the same property schema

The following endpoints must return identical field names and structures for property data:

| Endpoint | Current behavior | Required behavior |
|---|---|---|
| `GET /api/properties` | May use different field names than single-resource endpoints | Return array of properties with the exact same schema as single resource |
| `GET /api/properties/{id}` | Sometimes wraps in `data`, sometimes doesn't | Always return `{ "data": { ... } }` |
| `GET /api/properties/slug/{slug}` | Sometimes wraps in `data`, sometimes doesn't | Always return `{ "data": { ... } }` |

### PUT must accept the same schema as GET returns

| Endpoint | Current behavior | Required behavior |
|---|---|---|
| `PUT /api/admin/properties/{id}` | Accepts a mix of snake_case and camelCase; requires transformed payload | Accept the exact same schema returned by GET, with modifications |
| `POST /api/admin/properties` | Same inconsistencies | Accept the exact same schema as PUT |

### SEO endpoint alignment

| Endpoint | Current behavior | Required behavior |
|---|---|---|
| `GET /seo/property/{id}` | Returns SEO data with inconsistent field names | Return same structure as the `seo` nested object in property response |
| `PUT /seo/property/{id}` | Accepts unknown field set | Accept same structure as GET returns |

---

## Migration Strategy

To migrate without breaking the existing frontend, follow this phased approach:

### Phase 1 — Backend supports both formats (non-breaking)

1. **GET responses:** Add all standardized field names to responses **alongside** existing field names. The frontend normalization code already handles multiple variants, so it will pick up the standardized names.

2. **PUT/POST requests:** Accept both the old mixed-format payloads AND the new standardized format. Use server-side detection: if `meta_title` is present, use new format; if `seoTitle` is present, use old format.

3. **SEO consolidation:** Include the `seo` nested object in property GET responses. The frontend will detect it via the existing `seoObj` check in `normalizePropertyResponse`.

### Phase 2 — Frontend removes normalization (coordinated)

Once the backend is confirmed to return consistent responses:

1. Remove `normalizePropertyResponse` function
2. Remove `transformPropertyPayload` function
3. Remove `normalizeSpecificationItem` and `normalizeFloorPlanItem`
4. Simplify `getById`, `getBySlug`, `getAll` to use `response.data.data` directly
5. Simplify `buildPayload` to pass form data directly (with only filtering of empty items)
6. Remove the separate `getSeo` call and SEO merge logic in `PropertyForm.jsx`

### Phase 3 — Backend removes legacy format (cleanup)

1. Remove support for old camelCase field names in PUT/POST
2. Remove duplicate field names from GET responses
3. Remove the standalone `/seo/property/{id}` endpoint (or keep as alias)
4. Update Postman collection to reflect the final schema

### Estimated effort per phase

- **Phase 1:** Backend team only. Add consistent field names to serializers/transformers.
- **Phase 2:** Frontend team only. Remove ~250 lines of normalization code. Should be done in a single PR after backend Phase 1 is verified.
- **Phase 3:** Backend team only. Clean up deprecated field support after frontend Phase 2 is deployed.

### Risk mitigation

- Each phase is independently deployable
- No phase creates a breaking change if deployed in order
- Phase 1 can be tested by verifying the frontend still works with the new responses
- Phase 2 can be tested by verifying all property CRUD operations work without normalization
- Phase 3 is pure cleanup with no functional impact

---

## Appendix: Frontend Normalization Code to Remove

After backend migration, the following code can be deleted from the frontend:

| File | Lines | Function/Logic |
|---|---|---|
| `src/services/api.js` | 66-86 | `normalizeListResponse`, `extractPaginationMeta` |
| `src/services/api.js` | 88-186 | `transformPropertyPayload` (entire function) |
| `src/services/api.js` | 188-210 | `normalizeSpecificationItem`, `normalizeFloorPlanItem` |
| `src/services/api.js` | 212-368 | `normalizePropertyResponse` (entire function) |
| `src/pages/admin/PropertyForm.jsx` | 75-126 | SEO data merge logic |
| `src/pages/admin/PropertyForm.jsx` | 128-152 | Secondary normalization of specs, floor plans, gallery |
| `src/pages/admin/PropertyForm.jsx` | 477-579 | `buildPayload` transformation logic |

**Total: ~370 lines of normalization/transformation code** that exists solely because the backend API is inconsistent.
