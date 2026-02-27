/**
 * Property Configuration — Single source of truth for property type/category logic.
 *
 * This file centralizes all property type-related configuration to ensure consistency
 * across the admin panel, frontend, and API layer.
 *
 * ─── Laravel Migration Schema (for future backend) ────────────────────
 *
 * properties:
 *   - id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
 *   - title               VARCHAR(255) NOT NULL
 *   - slug                VARCHAR(255) UNIQUE NOT NULL
 *   - type                ENUM('rent', 'sale') NOT NULL DEFAULT 'sale'
 *   - category            VARCHAR(50) NOT NULL  -- apartment, villa, house, pg, studio, etc.
 *   - status              ENUM('pre-launch', 'under-construction', 'ready-to-move') DEFAULT 'ready-to-move'
 *   - price               DECIMAL(15, 2) NOT NULL
 *   - price_unit          VARCHAR(20) DEFAULT 'onwards'
 *   - developer           VARCHAR(255) NULLABLE  -- nullable for rent
 *   - developer_id        BIGINT UNSIGNED NULLABLE REFERENCES developers(id)
 *   - description         TEXT NOT NULL
 *   - possession          VARCHAR(100) NULLABLE
 *   - location_area       VARCHAR(255)
 *   - location_city       VARCHAR(100)
 *   - location_state      VARCHAR(100)
 *   - location_lat        DECIMAL(10, 7) NULLABLE
 *   - location_lng        DECIMAL(10, 7) NULLABLE
 *   - location_address    TEXT NULLABLE
 *   - construction_status JSON NULLABLE  -- null for rent properties
 *   - developer_info      JSON NULLABLE  -- null for rent properties
 *   - is_active           BOOLEAN DEFAULT true
 *   - publish_status      ENUM('draft', 'published') DEFAULT 'draft'
 *   - seo_title           VARCHAR(255) NULLABLE
 *   - seo_description     TEXT NULLABLE
 *   - seo_keywords        JSON NULLABLE
 *   - created_at          TIMESTAMP
 *   - updated_at          TIMESTAMP
 *
 * property_categories:
 *   - id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
 *   - type                ENUM('rent', 'sale') NOT NULL
 *   - value               VARCHAR(50) NOT NULL  -- e.g., apartment, villa, pg
 *   - label               VARCHAR(100) NOT NULL  -- Display name
 *   - is_active           BOOLEAN DEFAULT true
 *   - created_at          TIMESTAMP
 *   - updated_at          TIMESTAMP
 *   - UNIQUE(type, value)
 *
 * leads:
 *   - id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
 *   - name                VARCHAR(255) NOT NULL
 *   - email               VARCHAR(255) NOT NULL
 *   - phone               VARCHAR(20) NOT NULL
 *   - source              VARCHAR(100) NOT NULL  -- rent_requirement, rent_listing_request, property-detail-page, etc.
 *   - lead_type           VARCHAR(50) NULLABLE   -- rent_requirement, rent_listing_request, sale_enquiry
 *   - property_id         BIGINT UNSIGNED NULLABLE REFERENCES properties(id)
 *   - message             TEXT NULLABLE
 *   - status              ENUM('new', 'contacted', 'qualified', 'converted', 'lost') DEFAULT 'new'
 *   - notes               JSON NULLABLE
 *   - created_at          TIMESTAMP
 *   - updated_at          TIMESTAMP
 *
 * ─── Laravel API Endpoints ───────────────────────────────────────────
 *
 * GET    /api/properties                   - List properties (with filters)
 * GET    /api/properties/:id               - Single property
 * GET    /api/property/categories?type=rent - Get categories for a type
 * POST   /api/properties                   - Create property
 * PUT    /api/properties/:id               - Update property
 * DELETE /api/properties/:id               - Delete property
 * POST   /api/leads                        - Submit lead
 * GET    /api/leads                        - List leads (admin)
 *
 * ─── Laravel Controller Example ──────────────────────────────────────
 *
 * class PropertyCategoryController extends Controller
 * {
 *     public function index(Request $request)
 *     {
 *         $type = $request->query('type');
 *         $query = PropertyCategory::where('is_active', true);
 *         if ($type) {
 *             $query->where('type', $type);
 *         }
 *         return response()->json($query->get());
 *     }
 * }
 */

// Property types
export const PROPERTY_TYPES = ['sale', 'rent'];

// Fields that are nullable/irrelevant for rent properties
export const RENT_NULLABLE_FIELDS = [
  'developer',
  'constructionSpecs',
  'constructionTimeline',
  'developerInfo',
];

// Sections hidden on frontend for each property type
export const HIDDEN_FRONTEND_SECTIONS = {
  rent: ['finance', 'construction-status', 'builder', 'construction-specs'],
};

// Admin tabs disabled for each property type
export const DISABLED_ADMIN_TABS = {
  rent: ['constructionStatus', 'developer'],
};

/**
 * Check if a field should be included in the API payload for a given type.
 */
export const shouldIncludeField = (fieldName, propertyType) => {
  if (propertyType === 'rent' && RENT_NULLABLE_FIELDS.includes(fieldName)) {
    return false;
  }
  return true;
};
