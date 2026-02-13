# H.O.M Advisory — API Documentation

> Complete API reference for the Laravel backend developer.
> This document describes all endpoints the React frontend expects, including request/response formats, authentication, and database schema.

---

## Table of Contents

1. [Introduction](#introduction)
2. [Authentication](#authentication)
3. [Common Conventions](#common-conventions)
4. [Endpoints — Auth](#auth)
5. [Endpoints — Properties](#properties)
6. [Endpoints — Leads](#leads)
7. [Endpoints — Neighborhoods](#neighborhoods)
8. [Endpoints — Partners](#partners)
9. [Endpoints — FAQs](#faqs)
10. [Endpoints — Articles](#articles)
11. [Endpoints — Site Settings](#site-settings)
12. [Database Schema](#database-schema)
13. [ER Diagram](#er-diagram)

---

## Introduction

| Item | Value |
|---|---|
| **Base URL** | `/api/v1/` |
| **Authentication** | Bearer token (JWT recommended) |
| **Content-Type** | `application/json` |
| **Charset** | `UTF-8` |

### Response Format (Success — List)

```json
{
  "data": [ /* array of resource objects */ ],
  "meta": {
    "total": 120,
    "page": 1,
    "per_page": 12,
    "last_page": 10
  }
}
```

### Response Format (Success — Single Resource)

```json
{
  "data": { /* resource object */ }
}
```

### Response Format (Error)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The given data was invalid.",
    "details": {
      "title": ["The title field is required."],
      "price": ["The price must be a number."]
    }
  }
}
```

### Common HTTP Status Codes

| Code | Meaning |
|---|---|
| `200` | OK — Request succeeded |
| `201` | Created — Resource created successfully |
| `204` | No Content — Successful delete |
| `400` | Bad Request — Validation error |
| `401` | Unauthorized — Missing or invalid token |
| `403` | Forbidden — Insufficient permissions |
| `404` | Not Found — Resource does not exist |
| `422` | Unprocessable Entity — Validation failed |
| `500` | Internal Server Error |

---

## Authentication

The admin panel uses JWT Bearer tokens. Public endpoints (property listing, articles, FAQs, etc.) do not require authentication.

### Token Usage

All admin endpoints require the following header:

```
Authorization: Bearer <jwt_token>
```

If the token is missing, expired, or invalid the API must return `401`. The frontend will clear the token from `localStorage` and redirect to `/admin/login`.

---

## Common Conventions

### Timestamps

All resources include `created_at` and `updated_at` in ISO 8601 format:

```
"created_at": "2025-01-15T10:00:00Z"
"updated_at": "2025-12-20T14:30:00Z"
```

### Soft Deletes

Resources that support soft deletes should use a `deleted_at` timestamp. The frontend never sends this field — it is managed server-side.

### Slug Generation

Slugs are auto-generated from the `title` field on create. Format: lowercase, hyphened, unique.
Example: `"Nambiar District 25 Phase 2"` → `"nambiar-district-25-phase-2"`

---

## Auth

### POST `/api/v1/admin/login`

Login to admin panel.

| | |
|---|---|
| **Auth required** | No |
| **Rate limit** | 5 requests per minute per IP (recommended) |

**Request Body:**

| Field | Type | Required | Validation |
|---|---|---|---|
| `email` | string | Yes | Valid email format |
| `password` | string | Yes | Min 6 characters |

```json
{
  "email": "admin@homadvisory.com",
  "password": "admin123"
}
```

**Success Response (200):**

```json
{
  "data": {
    "user": {
      "id": 1,
      "name": "Admin User",
      "email": "admin@homadvisory.com",
      "role": "super-admin",
      "avatar": null
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (401):**

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password."
  }
}
```

---

### POST `/api/v1/admin/logout`

Invalidate the current token.

| | |
|---|---|
| **Auth required** | Yes |

**Request Headers:**

```
Authorization: Bearer <token>
```

**Success Response (200):**

```json
{
  "data": {
    "message": "Logged out successfully."
  }
}
```

---

### GET `/api/v1/admin/me`

Get the currently authenticated admin user.

| | |
|---|---|
| **Auth required** | Yes |

**Success Response (200):**

```json
{
  "data": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@homadvisory.com",
    "role": "super-admin",
    "avatar": null
  }
}
```

---

## Properties

### GET `/api/v1/properties`

List all active properties with filtering, sorting, and pagination.

| | |
|---|---|
| **Auth required** | No |

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `type` | string | — | Filter by listing type: `sale`, `rent` |
| `status` | string | — | Filter by status: `pre-launch`, `under-construction`, `ready-to-move` |
| `propertyType` | string | — | Filter by property type: `apartment`, `villa`, `plot` |
| `city` | string | — | Filter by city name |
| `minPrice` | number | — | Minimum price |
| `maxPrice` | number | — | Maximum price |
| `bhk` | string | — | Configuration filter, e.g. `"2 BHK"`, `"3 BHK"` |
| `tags` | string | — | Comma-separated tags, e.g. `"featured,premium"` |
| `search` | string | — | Full-text search on title, developer, location area |
| `sort` | string | `"-created_at"` | Sort field. Prefix `-` for descending. Options: `price`, `-price`, `created_at`, `-created_at`, `title` |
| `page` | integer | `1` | Page number |
| `limit` | integer | `12` | Items per page (max 50) |

**Success Response (200):**

```json
{
  "data": [
    {
      "id": 1,
      "title": "Nambiar District 25 Phase 2",
      "slug": "nambiar-district-25-phase-2",
      "type": "sale",
      "status": "ready-to-move",
      "propertyType": "apartment",
      "price": 12400000,
      "priceUnit": "onwards",
      "location": {
        "area": "Dommasandra, Sarjapur Road",
        "city": "Bangalore",
        "state": "Karnataka",
        "lat": 12.9058,
        "lng": 77.6854
      },
      "configuration": ["2 BHK", "3 BHK", "4 BHK", "4.5 BHK"],
      "dimensionRange": {
        "min": 1245,
        "max": 2990,
        "unit": "sqft"
      },
      "possession": "Ready to Move",
      "developer": "Nambiar Builders",
      "description": "Nambiar District 25 Phase 2 is a premium residential project...",
      "highlights": [
        "Prime Sarjapur Road location with excellent connectivity",
        "Ready to move apartments with premium finishes"
      ],
      "gallery": [
        "https://example.com/images/exterior.jpg",
        "https://example.com/images/living-room.jpg"
      ],
      "tags": ["featured", "ready-to-move", "premium"],
      "isActive": true,
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2025-12-20T14:30:00Z"
    }
  ],
  "meta": {
    "total": 48,
    "page": 1,
    "per_page": 12,
    "last_page": 4
  }
}
```

---

### GET `/api/v1/properties/featured`

Get featured properties for homepage display.

| | |
|---|---|
| **Auth required** | No |

Returns properties where `tags` contains `"featured"` and `isActive` is `true`. Limited to 8 results.

**Success Response (200):**

```json
{
  "data": [
    { /* property object (same structure as listing) */ }
  ]
}
```

---

### GET `/api/v1/properties/:slug`

Get a single property by its URL slug. Returns full detail including specifications, amenities, floor plans, nearby places, SEO data, and builder overview.

| | |
|---|---|
| **Auth required** | No |

**URL Params:**

| Param | Type | Description |
|---|---|---|
| `slug` | string | URL-friendly property identifier |

**Success Response (200):**

```json
{
  "data": {
    "id": 1,
    "title": "Nambiar District 25 Phase 2",
    "slug": "nambiar-district-25-phase-2",
    "type": "sale",
    "status": "ready-to-move",
    "propertyType": "apartment",
    "price": 12400000,
    "priceUnit": "onwards",
    "location": {
      "area": "Dommasandra, Sarjapur Road",
      "city": "Bangalore",
      "state": "Karnataka",
      "lat": 12.9058,
      "lng": 77.6854
    },
    "configuration": ["2 BHK", "3 BHK", "4 BHK", "4.5 BHK"],
    "dimensionRange": {
      "min": 1245,
      "max": 2990,
      "unit": "sqft"
    },
    "possession": "Ready to Move",
    "developer": "Nambiar Builders",
    "description": "Nambiar District 25 Phase 2 is a premium residential project...",
    "highlights": [
      "Prime Sarjapur Road location with excellent connectivity",
      "Ready to move apartments with premium finishes",
      "Surrounded by top schools, hospitals, and shopping centres",
      "Clubhouse with state-of-the-art amenities",
      "RERA registered project"
    ],
    "specifications": {
      "projectArea": "15 acres",
      "totalUnits": 750,
      "launchDate": "2021-06-15",
      "possessionDate": "2024-12-01",
      "reraId": "PRM/KA/RERA/1251/309/PR/180523/001927",
      "towers": 8,
      "floors": 14,
      "constructionType": "RCC framed structure"
    },
    "amenities": [
      {
        "icon": "mdi:swim",
        "name": "Swimming Pool",
        "category": "leisure"
      },
      {
        "icon": "mdi:dumbbell",
        "name": "Gymnasium",
        "category": "fitness"
      }
    ],
    "floorPlans": [
      {
        "config": "2 BHK",
        "area": "1245 sqft",
        "price": 12400000,
        "image": "https://example.com/floorplan-2bhk.jpg",
        "bedrooms": 2,
        "bathrooms": 2
      },
      {
        "config": "3 BHK",
        "area": "1650 sqft",
        "price": 16500000,
        "image": "https://example.com/floorplan-3bhk.jpg",
        "bedrooms": 3,
        "bathrooms": 2
      }
    ],
    "gallery": [
      "https://example.com/images/exterior.jpg",
      "https://example.com/images/living-room.jpg",
      "https://example.com/images/bedroom.jpg"
    ],
    "nearbyPlaces": [
      {
        "name": "Wipro Corporate Office",
        "distance": "3 km",
        "type": "workplace"
      },
      {
        "name": "Greenwood High School",
        "distance": "4 km",
        "type": "education"
      }
    ],
    "tags": ["featured", "ready-to-move", "premium"],
    "seoTitle": "Nambiar District 25 Phase 2 | 2, 3, 4 BHK Apartments in Sarjapur Road",
    "seoDescription": "Explore Nambiar District 25 Phase 2 - Premium ready-to-move apartments...",
    "seoKeywords": ["nambiar district 25", "sarjapur road apartments"],
    "schemaMarkup": "{\"@context\":\"https://schema.org\",\"@type\":\"Residence\",\"name\":\"Nambiar District 25 Phase 2\"}",
    "isActive": true,
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2025-12-20T14:30:00Z"
  }
}
```

**Error Response (404):**

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Property not found."
  }
}
```

---

### POST `/api/v1/admin/properties`

Create a new property.

| | |
|---|---|
| **Auth required** | Yes |

**Request Body:**

| Field | Type | Required | Validation |
|---|---|---|---|
| `title` | string | Yes | Max 255 chars |
| `type` | string | Yes | `sale` or `rent` |
| `status` | string | Yes | `pre-launch`, `under-construction`, `ready-to-move` |
| `propertyType` | string | Yes | `apartment`, `villa`, `plot` |
| `price` | number | Yes | Min 0 |
| `priceUnit` | string | Yes | e.g. `"onwards"`, `"per month"` |
| `location` | object | Yes | `{ area, city, state, lat, lng }` |
| `location.area` | string | Yes | Max 255 chars |
| `location.city` | string | Yes | Max 100 chars |
| `location.state` | string | Yes | Max 100 chars |
| `location.lat` | number | No | Latitude |
| `location.lng` | number | No | Longitude |
| `configuration` | array\<string\> | Yes | e.g. `["2 BHK", "3 BHK"]` |
| `dimensionRange` | object | Yes | `{ min, max, unit }` |
| `possession` | string | Yes | e.g. `"Ready to Move"`, `"Dec 2028"` |
| `developer` | string | Yes | Max 255 chars |
| `description` | string | Yes | Text |
| `highlights` | array\<string\> | No | List of highlight strings |
| `specifications` | object | No | See property detail schema above |
| `amenities` | array\<object\> | No | `[{ icon, name, category }]` |
| `floorPlans` | array\<object\> | No | `[{ config, area, price, image, bedrooms, bathrooms }]` |
| `gallery` | array\<string\> | No | Array of image URLs |
| `nearbyPlaces` | array\<object\> | No | `[{ name, distance, type }]` |
| `tags` | array\<string\> | No | e.g. `["featured", "premium"]` |
| `seoTitle` | string | No | Max 255 chars |
| `seoDescription` | string | No | Max 500 chars |
| `seoKeywords` | array\<string\> | No | List of keyword strings |
| `schemaMarkup` | string | No | JSON-LD string |
| `isActive` | boolean | No | Defaults to `true` |

**Success Response (201):**

```json
{
  "data": {
    "id": 9,
    "slug": "new-property-name",
    /* ...full property object... */
    "created_at": "2025-12-21T10:00:00Z",
    "updated_at": "2025-12-21T10:00:00Z"
  }
}
```

---

### PUT `/api/v1/admin/properties/:id`

Update an existing property (full replacement).

| | |
|---|---|
| **Auth required** | Yes |

**URL Params:**

| Param | Type | Description |
|---|---|---|
| `id` | integer | Property ID |

**Request Body:** Same as create. The `slug` is auto-regenerated if `title` changes.

**Success Response (200):**

```json
{
  "data": { /* updated property object */ }
}
```

---

### PATCH `/api/v1/admin/properties/:id/status`

Toggle a property's active state.

| | |
|---|---|
| **Auth required** | Yes |

**Request Body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `isActive` | boolean | Yes | `true` or `false` |

```json
{
  "isActive": false
}
```

**Success Response (200):**

```json
{
  "data": { /* updated property object */ }
}
```

---

### PATCH `/api/v1/admin/properties/:id/tags`

Update the tags array for a property.

| | |
|---|---|
| **Auth required** | Yes |

**Request Body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `tags` | array\<string\> | Yes | New tags array |

```json
{
  "tags": ["featured", "premium", "trending"]
}
```

**Success Response (200):**

```json
{
  "data": { /* updated property object */ }
}
```

---

### DELETE `/api/v1/admin/properties/:id`

Delete a property.

| | |
|---|---|
| **Auth required** | Yes |

**Success Response (204):** No content.

**Error Response (404):**

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Property not found."
  }
}
```

---

## Leads

### GET `/api/v1/admin/leads`

List all leads with filtering and pagination.

| | |
|---|---|
| **Auth required** | Yes |

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `status` | string | — | Filter by status: `new`, `contacted`, `qualified`, `converted`, `lost` |
| `source` | string | — | Filter by source: `property-detail-page`, `homepage-contact-form`, `property-listing-page`, `contact-page`, `sell-let-form` |
| `dateFrom` | string | — | ISO date, filter leads created on or after |
| `dateTo` | string | — | ISO date, filter leads created on or before |
| `search` | string | — | Search name, email, phone, message |
| `page` | integer | `1` | Page number |
| `limit` | integer | `20` | Items per page |

**Success Response (200):**

```json
{
  "data": [
    {
      "id": 1,
      "name": "Rajesh Kumar",
      "email": "rajesh.kumar@gmail.com",
      "phone": "+91 98765 43210",
      "source": "property-detail-page",
      "propertyId": 1,
      "property": {
        "id": 1,
        "title": "Nambiar District 25 Phase 2",
        "slug": "nambiar-district-25-phase-2"
      },
      "message": "Interested in 3 BHK at Nambiar District 25.",
      "status": "contacted",
      "notes": [
        {
          "text": "Called back, interested in 3BHK. Site visit scheduled.",
          "addedAt": "2025-12-18T10:30:00Z"
        }
      ],
      "created_at": "2025-12-15T14:00:00Z",
      "updated_at": "2025-12-18T10:30:00Z"
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "per_page": 20,
    "last_page": 3
  }
}
```

---

### GET `/api/v1/admin/leads/:id`

Get a single lead with full details.

| | |
|---|---|
| **Auth required** | Yes |

**Success Response (200):**

```json
{
  "data": {
    "id": 1,
    "name": "Rajesh Kumar",
    "email": "rajesh.kumar@gmail.com",
    "phone": "+91 98765 43210",
    "source": "property-detail-page",
    "propertyId": 1,
    "property": {
      "id": 1,
      "title": "Nambiar District 25 Phase 2",
      "slug": "nambiar-district-25-phase-2"
    },
    "message": "Interested in 3 BHK at Nambiar District 25.",
    "status": "contacted",
    "notes": [
      {
        "text": "Called back, interested in 3BHK.",
        "addedAt": "2025-12-18T10:30:00Z"
      }
    ],
    "created_at": "2025-12-15T14:00:00Z",
    "updated_at": "2025-12-18T10:30:00Z"
  }
}
```

---

### POST `/api/v1/leads`

Create a new lead (public — from website forms). No auth required.

| | |
|---|---|
| **Auth required** | No |

**Request Body:**

| Field | Type | Required | Validation |
|---|---|---|---|
| `name` | string | Yes | Max 255 chars |
| `email` | string | Yes | Valid email |
| `phone` | string | Yes | Valid phone number |
| `source` | string | Yes | One of: `property-detail-page`, `homepage-contact-form`, `property-listing-page`, `contact-page`, `sell-let-form` |
| `propertyId` | integer\|null | No | ID of the related property (null if general enquiry) |
| `message` | string | No | Max 2000 chars |

```json
{
  "name": "Amit Singh",
  "email": "amit@gmail.com",
  "phone": "+91 99887 76655",
  "source": "property-detail-page",
  "propertyId": 2,
  "message": "Looking for 3 BHK in Whitefield. Please call back."
}
```

**Success Response (201):**

The server should set `status` to `"new"` and `notes` to `[]` automatically.

```json
{
  "data": {
    "id": 4,
    "name": "Amit Singh",
    "email": "amit@gmail.com",
    "phone": "+91 99887 76655",
    "source": "property-detail-page",
    "propertyId": 2,
    "message": "Looking for 3 BHK in Whitefield.",
    "status": "new",
    "notes": [],
    "created_at": "2025-12-21T10:00:00Z",
    "updated_at": "2025-12-21T10:00:00Z"
  }
}
```

---

### PATCH `/api/v1/admin/leads/:id/status`

Update lead status.

| | |
|---|---|
| **Auth required** | Yes |

**Request Body:**

| Field | Type | Required | Validation |
|---|---|---|---|
| `status` | string | Yes | One of: `new`, `contacted`, `qualified`, `converted`, `lost` |

```json
{
  "status": "qualified"
}
```

**Success Response (200):**

```json
{
  "data": { /* updated lead object */ }
}
```

---

### POST `/api/v1/admin/leads/:id/notes`

Add a note to a lead.

| | |
|---|---|
| **Auth required** | Yes |

**Request Body:**

| Field | Type | Required | Validation |
|---|---|---|---|
| `text` | string | Yes | Max 2000 chars |

```json
{
  "text": "Scheduled a site visit for Saturday 10 AM."
}
```

**Success Response (200):**

The server appends the note with an `addedAt` timestamp.

```json
{
  "data": {
    "id": 1,
    "notes": [
      {
        "text": "Called back, interested in 3BHK.",
        "addedAt": "2025-12-18T10:30:00Z"
      },
      {
        "text": "Scheduled a site visit for Saturday 10 AM.",
        "addedAt": "2025-12-21T10:00:00Z"
      }
    ],
    "updated_at": "2025-12-21T10:00:00Z"
  }
}
```

---

### DELETE `/api/v1/admin/leads/:id`

Delete a lead.

| | |
|---|---|
| **Auth required** | Yes |

**Success Response (204):** No content.

---

### GET `/api/v1/admin/leads/export`

Export leads as CSV.

| | |
|---|---|
| **Auth required** | Yes |

**Query Parameters:** Same filters as the list endpoint (`status`, `source`, `dateFrom`, `dateTo`, `search`).

**Response:**

```
Content-Type: text/csv
Content-Disposition: attachment; filename="leads-export-2025-12-21.csv"
```

**CSV Columns:**

```
ID,Name,Email,Phone,Source,Property,Status,Message,Created At,Updated At
```

---

## Neighborhoods

### GET `/api/v1/neighborhoods`

List all active neighborhoods.

| | |
|---|---|
| **Auth required** | No |

**Success Response (200):**

```json
{
  "data": [
    {
      "id": 1,
      "name": "Electronic City",
      "image": "https://example.com/electronic-city.jpg",
      "propertyCount": 52,
      "city": "Bangalore",
      "isActive": true
    },
    {
      "id": 2,
      "name": "Marathahalli",
      "image": "https://example.com/marathahalli.jpg",
      "propertyCount": 78,
      "city": "Bangalore",
      "isActive": true
    }
  ]
}
```

---

### GET `/api/v1/admin/neighborhoods`

List all neighborhoods (including inactive). Admin only.

| | |
|---|---|
| **Auth required** | Yes |

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | integer | `1` | Page number |
| `limit` | integer | `20` | Items per page |

**Success Response (200):**

```json
{
  "data": [ /* neighborhood objects */ ],
  "meta": { "total": 6, "page": 1, "per_page": 20, "last_page": 1 }
}
```

---

### GET `/api/v1/admin/neighborhoods/:id`

Get a single neighborhood.

| | |
|---|---|
| **Auth required** | Yes |

**Success Response (200):**

```json
{
  "data": {
    "id": 1,
    "name": "Electronic City",
    "image": "https://example.com/electronic-city.jpg",
    "propertyCount": 52,
    "city": "Bangalore",
    "isActive": true,
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-06-01T00:00:00Z"
  }
}
```

---

### POST `/api/v1/admin/neighborhoods`

Create a neighborhood.

| | |
|---|---|
| **Auth required** | Yes |

**Request Body:**

| Field | Type | Required | Validation |
|---|---|---|---|
| `name` | string | Yes | Max 255 chars, unique |
| `image` | string | Yes | Valid URL |
| `propertyCount` | integer | No | Defaults to `0` |
| `city` | string | Yes | Max 100 chars |
| `isActive` | boolean | No | Defaults to `true` |

**Success Response (201):**

```json
{
  "data": { /* created neighborhood object */ }
}
```

---

### PUT `/api/v1/admin/neighborhoods/:id`

Update a neighborhood.

| | |
|---|---|
| **Auth required** | Yes |

**Request Body:** Same as create.

**Success Response (200):**

```json
{
  "data": { /* updated neighborhood object */ }
}
```

---

### DELETE `/api/v1/admin/neighborhoods/:id`

Delete a neighborhood.

| | |
|---|---|
| **Auth required** | Yes |

**Success Response (204):** No content.

---

## Partners

### GET `/api/v1/partners`

List all active partners, sorted by `order` ascending.

| | |
|---|---|
| **Auth required** | No |

**Success Response (200):**

```json
{
  "data": [
    {
      "id": 1,
      "name": "Prestige",
      "logo": "https://example.com/prestige-logo.png",
      "website": "https://www.prestigeconstructions.com",
      "isActive": true,
      "order": 1
    },
    {
      "id": 2,
      "name": "Brigade",
      "logo": "https://example.com/brigade-logo.png",
      "website": "https://www.brigadegroup.com",
      "isActive": true,
      "order": 2
    }
  ]
}
```

---

### GET `/api/v1/admin/partners`

List all partners (including inactive).

| | |
|---|---|
| **Auth required** | Yes |

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | integer | `1` | Page number |
| `limit` | integer | `20` | Items per page |

**Success Response (200):**

```json
{
  "data": [ /* partner objects */ ],
  "meta": { "total": 6, "page": 1, "per_page": 20, "last_page": 1 }
}
```

---

### GET `/api/v1/admin/partners/:id`

Get a single partner.

| | |
|---|---|
| **Auth required** | Yes |

**Success Response (200):**

```json
{
  "data": { /* partner object */ }
}
```

---

### POST `/api/v1/admin/partners`

Create a partner.

| | |
|---|---|
| **Auth required** | Yes |

**Request Body:**

| Field | Type | Required | Validation |
|---|---|---|---|
| `name` | string | Yes | Max 255 chars |
| `logo` | string | Yes | Valid URL |
| `website` | string | No | Valid URL |
| `isActive` | boolean | No | Defaults to `true` |
| `order` | integer | No | Display order, defaults to `0` |

**Success Response (201):**

```json
{
  "data": { /* created partner object */ }
}
```

---

### PUT `/api/v1/admin/partners/:id`

Update a partner.

| | |
|---|---|
| **Auth required** | Yes |

**Request Body:** Same as create.

**Success Response (200):**

```json
{
  "data": { /* updated partner object */ }
}
```

---

### DELETE `/api/v1/admin/partners/:id`

Delete a partner.

| | |
|---|---|
| **Auth required** | Yes |

**Success Response (204):** No content.

---

## FAQs

### GET `/api/v1/faqs`

List all active FAQs, sorted by `order` ascending. Optionally filter by category.

| | |
|---|---|
| **Auth required** | No |

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `category` | string | — | Filter by category: `buying`, `selling`, `renting`, `home-loan`, `legal`, `general` |

**Success Response (200):**

```json
{
  "data": [
    {
      "id": 1,
      "question": "What is the buying process?",
      "answer": "The buying process involves: 1) Property search and shortlisting...",
      "category": "buying",
      "order": 1,
      "isActive": true
    },
    {
      "id": 2,
      "question": "How do I schedule a property viewing?",
      "answer": "You can schedule a property viewing by...",
      "category": "general",
      "order": 2,
      "isActive": true
    }
  ]
}
```

---

### GET `/api/v1/admin/faqs`

List all FAQs (including inactive).

| | |
|---|---|
| **Auth required** | Yes |

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `category` | string | — | Filter by category |
| `page` | integer | `1` | Page number |
| `limit` | integer | `50` | Items per page |

**Success Response (200):**

```json
{
  "data": [ /* faq objects */ ],
  "meta": { "total": 16, "page": 1, "per_page": 50, "last_page": 1 }
}
```

---

### GET `/api/v1/admin/faqs/:id`

Get a single FAQ.

| | |
|---|---|
| **Auth required** | Yes |

**Success Response (200):**

```json
{
  "data": { /* faq object */ }
}
```

---

### POST `/api/v1/admin/faqs`

Create a FAQ.

| | |
|---|---|
| **Auth required** | Yes |

**Request Body:**

| Field | Type | Required | Validation |
|---|---|---|---|
| `question` | string | Yes | Max 500 chars |
| `answer` | string | Yes | Max 5000 chars |
| `category` | string | Yes | One of: `buying`, `selling`, `renting`, `home-loan`, `legal`, `general` |
| `order` | integer | No | Display order, defaults to `0` |
| `isActive` | boolean | No | Defaults to `true` |

**Success Response (201):**

```json
{
  "data": { /* created faq object */ }
}
```

---

### PUT `/api/v1/admin/faqs/:id`

Update a FAQ.

| | |
|---|---|
| **Auth required** | Yes |

**Request Body:** Same as create.

**Success Response (200):**

```json
{
  "data": { /* updated faq object */ }
}
```

---

### DELETE `/api/v1/admin/faqs/:id`

Delete a FAQ.

| | |
|---|---|
| **Auth required** | Yes |

**Success Response (204):** No content.

---

## Articles

### GET `/api/v1/articles`

List all active articles, sorted by `publishedAt` descending.

| | |
|---|---|
| **Auth required** | No |

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `category` | string | — | Filter by category: `market-trends`, `buying-guide`, `investment`, `legal`, `interior` |
| `search` | string | — | Full-text search on title, excerpt, content |
| `page` | integer | `1` | Page number |
| `limit` | integer | `9` | Items per page |

**Success Response (200):**

```json
{
  "data": [
    {
      "id": 5,
      "title": "Bangalore Real Estate Market Trends 2025",
      "slug": "bangalore-real-estate-market-trends-2025",
      "excerpt": "Bangalore continues to lead India's residential real estate growth...",
      "image": "https://example.com/article-image.jpg",
      "category": "market-trends",
      "tags": ["bangalore", "market-trends", "investment"],
      "author": "H.O.M Advisory Team",
      "readTime": 9,
      "publishedAt": "2025-12-15T10:00:00Z",
      "isActive": true,
      "created_at": "2025-12-15T10:00:00Z",
      "updated_at": "2025-12-15T10:00:00Z"
    }
  ],
  "meta": {
    "total": 9,
    "page": 1,
    "per_page": 9,
    "last_page": 1
  }
}
```

---

### GET `/api/v1/articles/:slug`

Get a single article by slug. Returns the full content.

| | |
|---|---|
| **Auth required** | No |

**Success Response (200):**

```json
{
  "data": {
    "id": 4,
    "title": "Understanding RERA: A Complete Guide for Indian Homebuyers",
    "slug": "understanding-rera-complete-guide-homebuyers",
    "excerpt": "RERA has transformed the Indian real estate landscape...",
    "content": "The Real Estate (Regulation and Development) Act, commonly known as RERA...",
    "image": "https://example.com/rera-guide.jpg",
    "category": "legal",
    "tags": ["rera", "legal", "homebuyer-guide"],
    "author": "H.O.M Advisory Team",
    "readTime": 8,
    "publishedAt": "2025-12-10T10:00:00Z",
    "isActive": true,
    "seoTitle": "Understanding RERA: Complete Guide | H.O.M Advisory",
    "seoDescription": "Comprehensive guide to RERA regulations in India.",
    "created_at": "2025-12-10T10:00:00Z",
    "updated_at": "2025-12-10T10:00:00Z"
  }
}
```

---

### GET `/api/v1/admin/articles`

List all articles (including inactive).

| | |
|---|---|
| **Auth required** | Yes |

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `category` | string | — | Filter by category |
| `search` | string | — | Search title and excerpt |
| `page` | integer | `1` | Page number |
| `limit` | integer | `20` | Items per page |

**Success Response (200):**

```json
{
  "data": [ /* article objects */ ],
  "meta": { "total": 9, "page": 1, "per_page": 20, "last_page": 1 }
}
```

---

### GET `/api/v1/admin/articles/:id`

Get a single article by ID.

| | |
|---|---|
| **Auth required** | Yes |

**Success Response (200):**

```json
{
  "data": { /* full article object */ }
}
```

---

### POST `/api/v1/admin/articles`

Create an article.

| | |
|---|---|
| **Auth required** | Yes |

**Request Body:**

| Field | Type | Required | Validation |
|---|---|---|---|
| `title` | string | Yes | Max 255 chars |
| `excerpt` | string | Yes | Max 500 chars |
| `content` | string | Yes | Markdown/HTML content |
| `image` | string | Yes | Valid URL |
| `category` | string | Yes | One of: `market-trends`, `buying-guide`, `investment`, `legal`, `interior` |
| `tags` | array\<string\> | No | List of tag strings |
| `author` | string | No | Defaults to current admin user name |
| `readTime` | integer | No | Estimated read time in minutes |
| `publishedAt` | string | No | ISO date; defaults to now |
| `isActive` | boolean | No | Defaults to `true` |
| `seoTitle` | string | No | Max 255 chars |
| `seoDescription` | string | No | Max 500 chars |

**Success Response (201):**

```json
{
  "data": { /* created article object with slug */ }
}
```

---

### PUT `/api/v1/admin/articles/:id`

Update an article.

| | |
|---|---|
| **Auth required** | Yes |

**Request Body:** Same as create.

**Success Response (200):**

```json
{
  "data": { /* updated article object */ }
}
```

---

### DELETE `/api/v1/admin/articles/:id`

Delete an article.

| | |
|---|---|
| **Auth required** | Yes |

**Success Response (204):** No content.

---

## Site Settings

### GET `/api/v1/settings`

Get all site settings. Returns a single settings object.

| | |
|---|---|
| **Auth required** | No |

**Success Response (200):**

```json
{
  "data": {
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
    "newsletterText": "Get latest real estate updates in your inbox",
    "heroText": {
      "title": "Find Your Dream Home",
      "subtitle": "Discover the perfect property from our exclusive collection"
    },
    "tagline": "ELEVATING EVERY EXPERIENCE IN REAL ESTATE",
    "companyName": "H.O.M Advisory",
    "companySubtitle": "HOME OFFICE MARKET",
    "companyDescription": "Your connection to the finest homes and experiences.",
    "footerLinks": {
      "homes": ["Buy", "Rent", "Sell/Let"],
      "offices": ["Flexible Workspace", "Direct Lease", "Retails"],
      "market": ["Home Loans", "Legal", "Home Interiors"]
    }
  }
}
```

---

### PUT `/api/v1/admin/settings`

Update site settings (replaces the entire settings object).

| | |
|---|---|
| **Auth required** | Yes |

**Request Body:** Same structure as the GET response `data` object. All fields optional — only send fields you want to update.

**Success Response (200):**

```json
{
  "data": { /* updated settings object */ }
}
```

---

## Database Schema

### Table: `properties`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | BIGINT UNSIGNED | No | Auto increment | Primary key |
| `title` | VARCHAR(255) | No | | |
| `slug` | VARCHAR(255) | No | | Unique index |
| `type` | ENUM('sale','rent') | No | | |
| `status` | ENUM('pre-launch','under-construction','ready-to-move') | No | | Index |
| `property_type` | ENUM('apartment','villa','plot') | No | | Index |
| `price` | DECIMAL(15,2) | No | | Index |
| `price_unit` | VARCHAR(50) | No | | e.g. "onwards", "per month" |
| `location_area` | VARCHAR(255) | No | | |
| `location_city` | VARCHAR(100) | No | | Index |
| `location_state` | VARCHAR(100) | No | | |
| `location_lat` | DECIMAL(10,7) | Yes | NULL | |
| `location_lng` | DECIMAL(10,7) | Yes | NULL | |
| `configuration` | JSON | No | | Array of config strings |
| `dimension_min` | INTEGER | No | | |
| `dimension_max` | INTEGER | No | | |
| `dimension_unit` | VARCHAR(20) | No | 'sqft' | |
| `possession` | VARCHAR(100) | No | | |
| `developer` | VARCHAR(255) | No | | Index |
| `description` | TEXT | No | | |
| `highlights` | JSON | Yes | NULL | Array of strings |
| `specifications` | JSON | Yes | NULL | Object |
| `amenities` | JSON | Yes | NULL | Array of objects |
| `floor_plans` | JSON | Yes | NULL | Array of objects |
| `gallery` | JSON | Yes | NULL | Array of URLs |
| `nearby_places` | JSON | Yes | NULL | Array of objects |
| `tags` | JSON | Yes | NULL | Array of strings |
| `seo_title` | VARCHAR(255) | Yes | NULL | |
| `seo_description` | VARCHAR(500) | Yes | NULL | |
| `seo_keywords` | JSON | Yes | NULL | Array of strings |
| `schema_markup` | TEXT | Yes | NULL | JSON-LD string |
| `is_active` | BOOLEAN | No | TRUE | Index |
| `created_at` | TIMESTAMP | No | CURRENT_TIMESTAMP | |
| `updated_at` | TIMESTAMP | No | CURRENT_TIMESTAMP | |
| `deleted_at` | TIMESTAMP | Yes | NULL | Soft delete |

**Indexes:** `slug` (unique), `type`, `status`, `property_type`, `location_city`, `price`, `developer`, `is_active`, `created_at`

---

### Table: `leads`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | BIGINT UNSIGNED | No | Auto increment | Primary key |
| `name` | VARCHAR(255) | No | | |
| `email` | VARCHAR(255) | No | | Index |
| `phone` | VARCHAR(20) | No | | |
| `source` | VARCHAR(50) | No | | Index |
| `property_id` | BIGINT UNSIGNED | Yes | NULL | Foreign key → `properties.id` |
| `message` | TEXT | Yes | NULL | |
| `status` | ENUM('new','contacted','qualified','converted','lost') | No | 'new' | Index |
| `created_at` | TIMESTAMP | No | CURRENT_TIMESTAMP | Index |
| `updated_at` | TIMESTAMP | No | CURRENT_TIMESTAMP | |
| `deleted_at` | TIMESTAMP | Yes | NULL | Soft delete |

**Indexes:** `email`, `source`, `status`, `property_id`, `created_at`

---

### Table: `lead_notes`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | BIGINT UNSIGNED | No | Auto increment | Primary key |
| `lead_id` | BIGINT UNSIGNED | No | | Foreign key → `leads.id`, cascade delete |
| `text` | TEXT | No | | |
| `added_at` | TIMESTAMP | No | CURRENT_TIMESTAMP | |

---

### Table: `neighborhoods`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | BIGINT UNSIGNED | No | Auto increment | Primary key |
| `name` | VARCHAR(255) | No | | Unique |
| `image` | VARCHAR(500) | No | | URL |
| `property_count` | INTEGER | No | 0 | |
| `city` | VARCHAR(100) | No | | |
| `is_active` | BOOLEAN | No | TRUE | |
| `created_at` | TIMESTAMP | No | CURRENT_TIMESTAMP | |
| `updated_at` | TIMESTAMP | No | CURRENT_TIMESTAMP | |

---

### Table: `partners`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | BIGINT UNSIGNED | No | Auto increment | Primary key |
| `name` | VARCHAR(255) | No | | |
| `logo` | VARCHAR(500) | No | | URL |
| `website` | VARCHAR(500) | Yes | NULL | URL |
| `is_active` | BOOLEAN | No | TRUE | |
| `order` | INTEGER | No | 0 | Sort order |
| `created_at` | TIMESTAMP | No | CURRENT_TIMESTAMP | |
| `updated_at` | TIMESTAMP | No | CURRENT_TIMESTAMP | |

---

### Table: `faqs`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | BIGINT UNSIGNED | No | Auto increment | Primary key |
| `question` | VARCHAR(500) | No | | |
| `answer` | TEXT | No | | |
| `category` | ENUM('buying','selling','renting','home-loan','legal','general') | No | | Index |
| `order` | INTEGER | No | 0 | Sort order |
| `is_active` | BOOLEAN | No | TRUE | |
| `created_at` | TIMESTAMP | No | CURRENT_TIMESTAMP | |
| `updated_at` | TIMESTAMP | No | CURRENT_TIMESTAMP | |

---

### Table: `articles`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | BIGINT UNSIGNED | No | Auto increment | Primary key |
| `title` | VARCHAR(255) | No | | |
| `slug` | VARCHAR(255) | No | | Unique index |
| `excerpt` | VARCHAR(500) | No | | |
| `content` | LONGTEXT | No | | Markdown/HTML |
| `image` | VARCHAR(500) | No | | URL |
| `category` | ENUM('market-trends','buying-guide','investment','legal','interior') | No | | Index |
| `tags` | JSON | Yes | NULL | Array of strings |
| `author` | VARCHAR(255) | No | | |
| `read_time` | INTEGER | Yes | NULL | Minutes |
| `published_at` | TIMESTAMP | Yes | NULL | Index |
| `is_active` | BOOLEAN | No | TRUE | |
| `seo_title` | VARCHAR(255) | Yes | NULL | |
| `seo_description` | VARCHAR(500) | Yes | NULL | |
| `created_at` | TIMESTAMP | No | CURRENT_TIMESTAMP | |
| `updated_at` | TIMESTAMP | No | CURRENT_TIMESTAMP | |
| `deleted_at` | TIMESTAMP | Yes | NULL | Soft delete |

---

### Table: `site_settings`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | BIGINT UNSIGNED | No | Auto increment | Primary key |
| `key` | VARCHAR(100) | No | | Unique index |
| `value` | JSON | No | | |
| `created_at` | TIMESTAMP | No | CURRENT_TIMESTAMP | |
| `updated_at` | TIMESTAMP | No | CURRENT_TIMESTAMP | |

Settings are stored as key-value pairs. Keys: `contactInfo`, `socialLinks`, `newsletterText`, `heroText`, `tagline`, `companyName`, `companySubtitle`, `companyDescription`, `footerLinks`.

---

### Table: `admin_users`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | BIGINT UNSIGNED | No | Auto increment | Primary key |
| `name` | VARCHAR(255) | No | | |
| `email` | VARCHAR(255) | No | | Unique index |
| `password` | VARCHAR(255) | No | | Bcrypt hashed |
| `role` | ENUM('super-admin','editor') | No | | |
| `avatar` | VARCHAR(500) | Yes | NULL | URL |
| `remember_token` | VARCHAR(100) | Yes | NULL | |
| `created_at` | TIMESTAMP | No | CURRENT_TIMESTAMP | |
| `updated_at` | TIMESTAMP | No | CURRENT_TIMESTAMP | |

---

## ER Diagram

```
┌──────────────────┐       ┌──────────────────┐
│   admin_users    │       │   properties     │
├──────────────────┤       ├──────────────────┤
│ id (PK)          │       │ id (PK)          │
│ name             │       │ title            │
│ email (UQ)       │       │ slug (UQ)        │
│ password         │       │ type             │
│ role             │       │ status           │
│ avatar           │       │ property_type    │
│ remember_token   │       │ price            │
│ created_at       │       │ price_unit       │
│ updated_at       │       │ location_*       │
└──────────────────┘       │ configuration    │
                           │ dimension_*      │
┌──────────────────┐       │ possession       │
│  site_settings   │       │ developer        │
├──────────────────┤       │ description      │
│ id (PK)          │       │ highlights       │
│ key (UQ)         │       │ specifications   │
│ value (JSON)     │       │ amenities        │
│ created_at       │       │ floor_plans      │
│ updated_at       │       │ gallery          │
└──────────────────┘       │ nearby_places    │
                           │ tags             │
┌──────────────────┐       │ seo_*            │
│  neighborhoods   │       │ schema_markup    │
├──────────────────┤       │ is_active        │
│ id (PK)          │       │ created_at       │
│ name (UQ)        │       │ updated_at       │
│ image            │       │ deleted_at       │
│ property_count   │       └────────┬─────────┘
│ city             │                │
│ is_active        │                │ 1:N (property_id)
│ created_at       │                │
│ updated_at       │       ┌────────┴─────────┐
└──────────────────┘       │     leads        │
                           ├──────────────────┤
┌──────────────────┐       │ id (PK)          │
│    partners      │       │ name             │
├──────────────────┤       │ email            │
│ id (PK)          │       │ phone            │
│ name             │       │ source           │
│ logo             │       │ property_id (FK) │
│ website          │       │ message          │
│ is_active        │       │ status           │
│ order            │       │ created_at       │
│ created_at       │       │ updated_at       │
│ updated_at       │       │ deleted_at       │
└──────────────────┘       └────────┬─────────┘
                                    │
┌──────────────────┐                │ 1:N (lead_id)
│      faqs        │                │
├──────────────────┤       ┌────────┴─────────┐
│ id (PK)          │       │   lead_notes     │
│ question         │       ├──────────────────┤
│ answer           │       │ id (PK)          │
│ category         │       │ lead_id (FK)     │
│ order            │       │ text             │
│ is_active        │       │ added_at         │
│ created_at       │       └──────────────────┘
│ updated_at       │
└──────────────────┘       ┌──────────────────┐
                           │    articles      │
                           ├──────────────────┤
                           │ id (PK)          │
                           │ title            │
                           │ slug (UQ)        │
                           │ excerpt          │
                           │ content          │
                           │ image            │
                           │ category         │
                           │ tags             │
                           │ author           │
                           │ read_time        │
                           │ published_at     │
                           │ is_active        │
                           │ seo_*            │
                           │ created_at       │
                           │ updated_at       │
                           │ deleted_at       │
                           └──────────────────┘
```

### Relationships

| Relationship | Type | Description |
|---|---|---|
| `properties` → `leads` | One-to-Many | A property can have many leads. `leads.property_id` references `properties.id` (nullable). |
| `leads` → `lead_notes` | One-to-Many | A lead can have many notes. `lead_notes.lead_id` references `leads.id` (cascade delete). |

### Migration Notes for Laravel

1. Use Laravel's built-in `$table->timestamps()` for `created_at` / `updated_at`.
2. Use `$table->softDeletes()` for tables that need `deleted_at`.
3. JSON columns (`configuration`, `highlights`, `amenities`, etc.) should use `$table->json()` and be cast to `array` in the Eloquent model.
4. Use Laravel API Resources to transform snake_case DB columns to camelCase JSON responses (matching the frontend's expected format).
5. Implement `Sluggable` trait or use `Str::slug()` in model events to auto-generate slugs.
6. Use Laravel Sanctum or Passport for JWT-compatible API authentication.
7. Consider using Laravel Form Requests for validation.

---

*Generated for H.O.M Advisory — React Frontend v0.1.0*
