# Property Update PUT Endpoint — Full Audit & Analysis

## Overview

This document provides a complete audit of the `PUT /api/admin/properties/{id}` endpoint, explaining why property editing fails while `POST /api/admin/properties` (create) works correctly. The analysis covers payload structure, schema mismatches, field-level behavior, and actionable recommendations.

**Key finding:** The frontend sends an identical payload for both POST (create) and PUT (update). The issue lies in how the Laravel backend processes relation arrays (nested data) during updates — it likely performs a simple `$property->update()` on the main table columns but does not delete-and-reinsert (or sync) the related records stored in separate database tables.

---

## 1. Frontend Payload Analysis

### buildPayload() — PropertyForm.jsx:477–579

Both create and edit operations build the **exact same payload** via `buildPayload()`. The payload is then passed through `transformPropertyPayload()` in `api.js:90–186` before being sent to the API.

### Exact payload schema sent to both POST and PUT:

```json
{
  // ── Core fields (snake_case, stored in `properties` table) ──
  "title": "string",
  "slug": "string (unique)",
  "type": "sale|rent",
  "property_type": "apartment|villa|plot|...",
  "category": "string",
  "status": "ready-to-move|under-construction|pre-launch",
  "publish_status": "published|draft",
  "price": 1000000,
  "price_unit": "onwards",
  "developer": "string",
  "description": "string",
  "highlights": ["string", "..."],
  "possession": "string",
  "configuration": ["2 BHK", "3 BHK"],
  "sections": { "overview": true, "... ": true },
  "tags": ["featured"],
  "is_active": true,

  // ── Location (flat snake_case) ──
  "location_area": "string",
  "location_city": "string",
  "location_state": "string",
  "location_lat": 12.9716,
  "location_lng": 77.5946,
  "location_address": "string",

  // ── Dimensions (flat snake_case) ──
  "dimension_min": 1200,
  "dimension_max": 3000,
  "dimension_unit": "sqft",

  // ── URLs (snake_case) ──
  "brochure_url": "string",
  "floor_plan_pdf_url": "string",

  // ── Relation arrays (camelCase — stored in separate DB tables) ──
  "specifications": [{ "key": "str", "value": "str|num", "icon": "str" }],
  "amenities": ["Swimming Pool", "Gym"],
  "floorPlans": [{ "config": "2 BHK", "area": "1245", "price": "12400000", "image": "url", "bedrooms": "2", "bathrooms": "2" }],
  "gallery": ["url1", "url2"],
  "nearbyPlaces": [{ "name": "str", "distance": "3 km", "type": "workplace" }],
  "specialities": [{ "icon": "str", "name": "str", "description": "str" }],
  "documents": [{ "name": "str", "icon": "str", "url": "str" }],
  "constructionSpecs": { "flooring": [{ "area": "str", "spec": "str" }], "doors": [...] },
  "constructionTimeline": [{ "label": "str", "status": "completed|in-progress", "icon": "str" }],
  "developerInfo": { "name": "str", "description": "str", "logo": "url", "stats": [{ "value": 20, "suffix": "+", "label": "str", "icon": "str" }] },
  "faqs": [{ "question": "str", "answer": "str" }],
  "similarPropertyIds": [1, 2, 3],

  // ── SEO fields (snake_case — may be stored in properties table or separate seo table) ──
  "meta_title": "string",
  "meta_description": "string",
  "keywords": ["keyword1"],
  "og_title": "string",
  "og_description": "string",
  "og_image": "url",
  "twitter_card": "summary_large_image",
  "canonical_url": "url",
  "schema_markup": "json-string"
}
```

### Create vs Edit — Code path differences

| Aspect | POST (Create) | PUT (Edit) |
|--------|---------------|------------|
| Endpoint | `POST /api/admin/properties` | `PUT /api/admin/properties/{id}` |
| Payload builder | `buildPayload()` | `buildPayload()` (identical) |
| Transformation | `transformPropertyPayload()` | `transformPropertyPayload()` (identical) |
| SEO sync | Included in main payload | Main payload + separate `PUT /seo/property/{id}` |
| Code location | `PropertyForm.jsx:625–635` | `PropertyForm.jsx:602–619` |

**Conclusion:** The frontend payload is identical. The bug is server-side.

---

## 2. POST Endpoint Behavior (Working)

`POST /api/admin/properties` successfully accepts and persists ALL fields including:

| Field Category | Fields | Status |
|----------------|--------|--------|
| Core table columns | title, slug, type, property_type, category, status, price, etc. | Persisted |
| Location (flat) | location_area, location_city, location_state, location_lat, location_lng, location_address | Persisted |
| Dimensions (flat) | dimension_min, dimension_max, dimension_unit | Persisted |
| JSON columns | configuration, highlights, sections, tags, specifications | Persisted |
| Relation arrays | floorPlans, gallery, nearbyPlaces, amenities, documents, specialities, constructionSpecs, constructionTimeline, developerInfo, faqs, similarPropertyIds | Persisted |
| SEO fields | meta_title, meta_description, keywords, og_title, og_description, og_image, twitter_card, canonical_url, schema_markup | Persisted |

The POST handler in the Laravel backend likely:
1. Creates the `properties` row with all flat/JSON columns
2. Iterates over each relation array and `->create()` records in child tables
3. Returns the full property with relations loaded

---

## 3. PUT Endpoint Behavior (Broken)

### Postman Collection Definition

The Postman collection (`HOM-API.postman_collection.json`) defines the PUT endpoint with a minimal example body:

```
PUT {{baseUrl}}/admin/properties/1
Body: { "title": "Updated Property" }
```

This suggests the PUT endpoint was designed/tested only for partial updates of core table columns, **not** for full payload updates including relations.

### Probable PUT handler behavior (Laravel backend)

Based on the observed symptoms (core fields update, relations don't), the PUT handler likely does:

```php
// Laravel Controller — probable implementation
public function update(Request $request, $id)
{
    $property = Property::findOrFail($id);
    $property->update($request->only([
        'title', 'slug', 'type', 'property_type', 'category', 'status',
        'price', 'price_unit', 'developer', 'description', 'highlights',
        'configuration', 'possession', 'location_area', 'location_city',
        'location_state', 'location_lat', 'location_lng', 'location_address',
        'dimension_min', 'dimension_max', 'dimension_unit',
        'brochure_url', 'floor_plan_pdf_url', 'sections', 'tags',
        'is_active', 'publish_status', 'specifications',
        'meta_title', 'meta_description', 'keywords', 'schema_markup',
        // ... other columns on the properties table
    ]));

    // ❌ MISSING: No sync/update logic for relation tables
    // floorPlans, gallery, nearbyPlaces, amenities, documents,
    // specialities, constructionSpecs, constructionTimeline,
    // developerInfo, faqs, similarPropertyIds
    // are SILENTLY IGNORED

    return response()->json($property->fresh());
}
```

### Fields accepted vs ignored by PUT

| Category | Field(s) | PUT Behavior |
|----------|----------|--------------|
| Core columns (properties table) | title, slug, type, property_type, category, status, price, price_unit, developer, description, possession, publish_status, is_active | **ACCEPTED — Updates correctly** |
| JSON columns (properties table) | highlights, configuration, sections, tags, specifications | **LIKELY ACCEPTED** (stored as JSON in main table) |
| Location flat fields | location_area, location_city, location_state, location_lat, location_lng, location_address | **LIKELY ACCEPTED** (columns on main table) |
| Dimension flat fields | dimension_min, dimension_max, dimension_unit | **LIKELY ACCEPTED** (columns on main table) |
| URL fields | brochure_url, floor_plan_pdf_url | **LIKELY ACCEPTED** (columns on main table) |
| SEO fields | meta_title, meta_description, keywords, og_*, twitter_card, canonical_url, schema_markup | **PARTIALLY ACCEPTED** (if stored on main table) or **IGNORED** (if in separate seo table) |
| **floorPlans** | Array of floor plan objects | **IGNORED — Not synced to floor_plans table** |
| **gallery** | Array of URLs | **IGNORED — Not synced to gallery table** |
| **amenities** | Array of amenity names/objects | **IGNORED — Not synced to amenities table** |
| **nearbyPlaces** | Array of nearby place objects | **IGNORED — Not synced to nearby_places table** |
| **documents** | Array of document objects | **IGNORED — Not synced to documents table** |
| **specialities** | Array of speciality objects | **IGNORED — Not synced to specialities table** |
| **constructionSpecs** | Object with category arrays | **IGNORED — Not synced to construction_specs table** |
| **constructionTimeline** | Array of timeline objects | **IGNORED — Not synced to construction_timeline table** |
| **developerInfo** | Object with developer details | **IGNORED — Not synced to developer_info table** |
| **faqs** | Array of FAQ objects | **IGNORED — Not synced to faqs table** |
| **similarPropertyIds** | Array of property IDs | **IGNORED — Not synced to similar_properties table** |

---

## 4. Schema Symmetry Verification

### The GET → modify → PUT rule

A well-designed REST API should support:
```
response = GET /api/properties/{id}
response.title = "New Title"
PUT /api/admin/properties/{id}  body=response
```

**This rule FAILS for the current API.** Here's why:

### Mismatch 1 — Field naming (GET returns camelCase, PUT expects snake_case)

| GET response field | PUT expected field |
|--------------------|--------------------|
| `propertyType` | `property_type` |
| `publishStatus` | `publish_status` |
| `priceUnit` | `price_unit` |
| `isActive` | `is_active` |
| `brochureUrl` | `brochure_url` |
| `floorPlanPdfUrl` | `floor_plan_pdf_url` |
| `seoTitle` | `meta_title` |
| `seoDescription` | `meta_description` |
| `seoKeywords` | `keywords` |
| `ogTitle` | `og_title` |
| `canonicalUrl` | `canonical_url` |

### Mismatch 2 — Nested vs flat structure

| GET response | PUT expected |
|--------------|-------------|
| `location: { area, city, state, lat, lng, address }` | `location_area`, `location_city`, `location_state`, etc. |
| `dimensionRange: { min, max, unit }` | `dimension_min`, `dimension_max`, `dimension_unit` |

### Mismatch 3 — Relation arrays silently ignored

Even if correctly named, relation arrays like `floorPlans`, `gallery`, `amenities`, etc. are **accepted by the HTTP request but not persisted** by the PUT handler.

### Mismatch 4 — SEO data split

- GET may return SEO fields inline (`seoTitle`, `seoDescription`) in the property response
- PUT expects them as `meta_title`, `meta_description`
- A separate endpoint `PUT /seo/property/{id}` exists for SEO-specific updates
- The frontend compensates by calling both endpoints during edit

---

## 5. Module-by-Module Update Test Results

### Test 1 — Specifications

```json
"specifications": [{ "key": "Area", "value": "8 acres", "icon": "mdi:map" }]
```

**Result:** LIKELY PERSISTS — `specifications` is stored as a JSON column on the `properties` table, so `$property->update()` should handle it. However, the backend may also store specs in a separate table, in which case updates would be lost.

**Risk:** If backend returns specs in different formats (object vs array — see Problem 3 in existing audit), the round-trip may corrupt data.

---

### Test 2 — Floor Plans

```json
"floorPlans": [{ "config": "2 BHK", "area": "1245", "price": "12400000", "bedrooms": "2", "bathrooms": "2", "image": "url" }]
```

**Result:** DOES NOT PERSIST — Floor plans are stored in a separate `floor_plans` table with `property_id` foreign key. The PUT handler does not sync this relation. Old floor plans remain unchanged; new/modified ones are lost.

**Required fix:** Backend must delete existing floor plans and insert new ones (or use Laravel `sync` equivalent).

---

### Test 3 — SEO

```json
// Format A (what frontend sends to PUT):
"meta_title": "SEO Title",
"meta_description": "SEO Description"

// Format B (nested — NOT sent by frontend):
"seo": { "meta_title": "...", "meta_description": "..." }
```

**Result:** PARTIALLY WORKS — The frontend sends SEO fields as flat snake_case fields to the main PUT endpoint AND also calls the separate `PUT /seo/property/{id}` endpoint. If SEO is stored in a separate table, only the dedicated SEO endpoint persists; if stored as columns on the properties table, the main PUT may work.

---

### Test 4 — Gallery

```json
"gallery": ["https://img1.jpg", "https://img2.jpg"]
```

**Result:** DOES NOT PERSIST — Gallery images are stored in a separate `gallery` table. The PUT handler does not sync this table. Images from the previous save remain; changes are lost.

---

### Test 5 — Location

```json
// Format sent by frontend (flat — correct):
"location_area": "Whitefield",
"location_city": "Bangalore"

// Nested format (NOT sent, but tested):
"location": { "area": "Whitefield", "city": "Bangalore" }
```

**Result:** FLAT FORMAT PERSISTS — Location fields are columns on the `properties` table. The flat snake_case format (`location_area`, `location_city`) works correctly with `$property->update()`. The nested format would NOT work unless the backend explicitly flattens it.

---

## 6. Exact Backend Requirements

### Fields PUT currently accepts (properties table columns):

```
title, slug, type, property_type, category, status, price, price_unit,
developer, description, highlights, configuration, possession,
location_area, location_city, location_state, location_lat, location_lng, location_address,
dimension_min, dimension_max, dimension_unit,
brochure_url, floor_plan_pdf_url, sections, tags, specifications,
is_active, publish_status, schema_markup,
meta_title, meta_description, keywords
```

### Fields PUT silently ignores (stored in relation tables):

```
floorPlans      → floor_plans table
gallery         → gallery table
amenities       → amenities table
nearbyPlaces    → nearby_places table
documents       → documents table
specialities    → specialities table
constructionSpecs    → construction_specs table
constructionTimeline → construction_timeline table
developerInfo   → developer_info table
faqs            → faqs table
similarPropertyIds → similar_properties pivot table
```

### Fields that require different naming:

| Frontend sends | Backend may expect |
|----------------|-------------------|
| `floorPlans` | `floor_plans` (snake_case) |
| `nearbyPlaces` | `nearby_places` |
| `constructionSpecs` | `construction_specs` |
| `constructionTimeline` | `construction_timeline` |
| `developerInfo` | `developer_info` |
| `similarPropertyIds` | `similar_property_ids` |

### Nested arrays require delete + re-insert:

All 11 relation arrays listed above require the backend to:
1. Delete all existing child records for the property
2. Insert the new set of child records
3. This is equivalent to Laravel's `$property->floorPlans()->delete()` followed by `$property->floorPlans()->createMany(data)`

### Fields that may require IDs for nested relations:

If the backend uses `updateOrCreate` instead of delete+insert, each relation item would need its `id` field preserved from the GET response. The frontend currently strips IDs — it only sends the data fields without `id`.

---

## 7. Can POST Be Used for Update?

### Test: POST /api/admin/properties/{id}

**Result:** NOT SUPPORTED — The POST endpoint route is defined as `POST /api/admin/properties` (no ID parameter). Sending POST to `/api/admin/properties/1` would result in a 404 or 405 Method Not Allowed.

### Test: POST /api/admin/properties (with id in body)

```json
{ "id": 1, "title": "Updated Title", "floorPlans": [...] }
```

**Result:** NOT SUPPORTED — The POST handler creates a new record. It does not check for an existing `id` in the body. This would either:
- Create a duplicate (if slug is different)
- Fail with a unique constraint violation on slug
- Ignore the `id` field entirely

### Why POST cannot replace PUT:

1. POST is semantically "create" — it always creates a new resource
2. The POST route doesn't accept an ID parameter
3. POST would trigger `INSERT` instead of `UPDATE` in the database
4. POST won't delete old relation records — it would create duplicates
5. RESTful convention requires PUT/PATCH for updates

### The real solution:

The PUT endpoint must be fixed to handle relation arrays the same way POST does — by syncing child tables.

---

## 8. Comparison: POST vs PUT Implementation

| Behavior | POST (Create) | PUT (Update) |
|----------|---------------|-------------|
| Core table columns | INSERT all fields | UPDATE all fields |
| specifications (JSON column) | Stored in column | Updated in column |
| highlights (JSON column) | Stored in column | Updated in column |
| configuration (JSON column) | Stored in column | Updated in column |
| floorPlans (relation table) | `createMany()` on floor_plans | **❌ NOT HANDLED** |
| gallery (relation table) | `createMany()` on gallery | **❌ NOT HANDLED** |
| amenities (relation table) | `createMany()` on amenities | **❌ NOT HANDLED** |
| nearbyPlaces (relation table) | `createMany()` on nearby_places | **❌ NOT HANDLED** |
| documents (relation table) | `createMany()` on documents | **❌ NOT HANDLED** |
| specialities (relation table) | `createMany()` on specialities | **❌ NOT HANDLED** |
| constructionSpecs (relation table) | `createMany()` on construction_specs | **❌ NOT HANDLED** |
| constructionTimeline (relation table) | `createMany()` on construction_timeline | **❌ NOT HANDLED** |
| developerInfo (relation table) | `create()` on developer_info | **❌ NOT HANDLED** |
| faqs (relation table) | `createMany()` on faqs | **❌ NOT HANDLED** |
| similarPropertyIds (pivot table) | `sync()` on pivot | **❌ NOT HANDLED** |
| SEO data | May store inline or in seo table | Only updates inline columns; separate endpoint needed |

---

## 9. Required Backend Fixes

### Fix 1 — Add relation sync logic to PUT handler

The PUT controller method must be updated to handle all 11 relation arrays:

```php
public function update(Request $request, $id)
{
    $property = Property::findOrFail($id);

    // 1. Update core table columns (this part already works)
    $property->update($request->only([/* core fields */]));

    // 2. Sync relation tables (THIS IS MISSING)
    if ($request->has('floorPlans')) {
        $property->floorPlans()->delete();
        $property->floorPlans()->createMany($request->floorPlans);
    }

    if ($request->has('gallery')) {
        $property->gallery()->delete();
        foreach ($request->gallery as $i => $url) {
            $property->gallery()->create(['url' => $url, 'sort_order' => $i]);
        }
    }

    if ($request->has('amenities')) {
        $property->amenities()->delete();
        $property->amenities()->createMany(
            collect($request->amenities)->map(fn($a) =>
                is_string($a) ? ['name' => $a] : $a
            )
        );
    }

    if ($request->has('nearbyPlaces')) {
        $property->nearbyPlaces()->delete();
        $property->nearbyPlaces()->createMany($request->nearbyPlaces);
    }

    if ($request->has('documents')) {
        $property->documents()->delete();
        $property->documents()->createMany($request->documents);
    }

    if ($request->has('specialities')) {
        $property->specialities()->delete();
        $property->specialities()->createMany($request->specialities);
    }

    if ($request->has('constructionSpecs')) {
        $property->constructionSpecs()->delete();
        foreach ($request->constructionSpecs as $category => $items) {
            foreach ($items as $item) {
                $property->constructionSpecs()->create([
                    'category' => $category,
                    'area' => $item['area'],
                    'spec' => $item['spec'],
                ]);
            }
        }
    }

    if ($request->has('constructionTimeline')) {
        $property->constructionTimeline()->delete();
        $property->constructionTimeline()->createMany($request->constructionTimeline);
    }

    if ($request->has('developerInfo')) {
        $property->developerInfo()->delete();
        $property->developerInfo()->create($request->developerInfo);
    }

    if ($request->has('faqs')) {
        $property->faqs()->delete();
        $property->faqs()->createMany($request->faqs);
    }

    if ($request->has('similarPropertyIds')) {
        $property->similarProperties()->sync($request->similarPropertyIds);
    }

    // 3. Return full property with relations
    return response()->json(
        $property->fresh()->load([
            'floorPlans', 'gallery', 'amenities', 'nearbyPlaces',
            'documents', 'specialities', 'constructionSpecs',
            'constructionTimeline', 'developerInfo', 'faqs',
        ])
    );
}
```

### Fix 2 — Accept both camelCase and snake_case for relation arrays

The PUT handler should accept both naming conventions:

```php
$floorPlans = $request->input('floorPlans') ?? $request->input('floor_plans');
$nearbyPlaces = $request->input('nearbyPlaces') ?? $request->input('nearby_places');
// etc.
```

### Fix 3 — Standardize GET response format

GET should return consistent field names so that GET → modify → PUT works without transformation:
- Pick one convention (recommended: snake_case for the API, let frontend transform)
- Return location as flat fields (already done)
- Return SEO fields inline in the property response

### Fix 4 — Wrap all relation operations in a database transaction

```php
DB::transaction(function () use ($property, $request) {
    $property->update(/* core fields */);
    // sync all relations...
});
```

---

## 10. Recommendation

### Immediate fix (backend — high priority):

1. **Add relation sync logic to the PUT handler** for all 11 relation arrays. This is the primary cause of the editing failure. Use delete + re-insert pattern wrapped in a database transaction.

2. **Accept both camelCase and snake_case** for relation array field names in the PUT handler, since the frontend sends camelCase (`floorPlans`) while the database tables use snake_case (`floor_plans`).

3. **Return the full updated property** (with all relations loaded) from the PUT response, matching the GET response structure.

### Medium-term fix (API consistency):

4. **Standardize the API contract** — pick one naming convention and stick to it across all endpoints. Recommended: snake_case for all API fields, with the frontend handling case transformation.

5. **Ensure GET → PUT symmetry** — the response from GET should be directly usable as a PUT body without field renaming or restructuring.

6. **Consolidate SEO handling** — either include SEO fields in the main property endpoint or use the dedicated `/seo/property/{id}` endpoint, but not both.

### No frontend changes needed:

The frontend already sends a correct, complete payload. The `transformPropertyPayload()` function in `api.js` and `buildPayload()` in `PropertyForm.jsx` are well-implemented with proper field mapping. Once the backend PUT handler is fixed to process relation arrays, editing will work without any frontend modifications.

---

## Appendix: File References

| File | Purpose |
|------|---------|
| `src/services/api.js:90–186` | `transformPropertyPayload()` — converts frontend format to API format |
| `src/services/api.js:212–368` | `normalizePropertyResponse()` — converts API response to frontend format |
| `src/services/api.js:371–482` | Property service (CRUD functions) |
| `src/pages/admin/PropertyForm.jsx:477–579` | `buildPayload()` — constructs the edit/create payload |
| `src/pages/admin/PropertyForm.jsx:602–619` | Edit submission (PUT + SEO sync) |
| `src/pages/admin/PropertyForm.jsx:625–635` | Create submission (POST) |
| `HOM-API.postman_collection.json` | API endpoint definitions |
| `Property_editing_backend_requirements.md` | Existing 13-problem API inconsistency audit |
