import apiClient from './api';

/**
 * Dedicated SEO Service Layer
 *
 * Provides a clean, centralized API for all SEO operations.
 * Abstracts the data layer so the UI never makes raw HTTP calls for SEO data.
 *
 * Current backend: JSON Server (properties collection with SEO fields inline).
 * Future backend:  Laravel + MySQL with a dedicated `seo_properties` table.
 *
 * When migrating to Laravel, only this file needs to change —
 * swap endpoint paths and response shapes here.
 *
 * Laravel route mapping:
 *   GET    /api/seo/properties          → SeoController@index
 *   GET    /api/seo/property/:id        → SeoController@show
 *   PUT    /api/seo/property/:id        → SeoController@update
 *   POST   /api/seo/auto-generate       → SeoController@autoGenerate
 *   POST   /api/seo/bulk-auto-generate  → SeoController@bulkAutoGenerate
 *   GET    /api/seo/property/:id/score  → SeoController@score
 */

// Helper: extract SEO fields from a full property object
const extractSeoFields = (property) => ({
  id: property.id,
  propertyId: property.id,
  title: property.title,
  slug: property.slug,
  location: property.location,
  developer: property.developer,
  configuration: property.configuration,
  dimensionRange: property.dimensionRange,
  status: property.status,
  possession: property.possession,
  price: property.price,
  priceUnit: property.priceUnit,
  propertyType: property.propertyType,
  type: property.type,
  description: property.description,
  gallery: property.gallery,
  highlights: property.highlights,
  amenities: property.amenities,
  // SEO-specific fields
  seoTitle: property.seoTitle || '',
  seoDescription: property.seoDescription || '',
  seoKeywords: property.seoKeywords || [],
  canonicalUrl: property.canonicalUrl || '',
  ogTitle: property.ogTitle || '',
  ogDescription: property.ogDescription || '',
  ogImage: property.ogImage || '',
  twitterCard: property.twitterCard || 'summary_large_image',
  schemaMarkup: property.schemaMarkup || '',
  tags: property.tags || [],
});

// Helper: normalize list response
const normalizeListResponse = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  if (data && Array.isArray(data.items)) return data.items;
  return [];
};

const seoService = {
  /**
   * GET /api/seo/properties
   * Fetch all properties with their SEO data.
   */
  getAllProperties: async () => {
    try {
      // JSON Server: fetch from /properties
      // Laravel:     GET /api/seo/properties
      const response = await apiClient.get('/properties');
      const properties = normalizeListResponse(response.data);
      return properties.map(extractSeoFields);
    } catch (error) {
      throw error;
    }
  },

  /**
   * GET /api/seo/property/:id
   * Fetch SEO data for a single property.
   */
  getPropertySeo: async (id) => {
    try {
      const response = await apiClient.get(`/properties/${id}`);
      return extractSeoFields(response.data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * PUT /api/seo/property/:id
   * Update SEO data for a single property.
   */
  updatePropertySeo: async (id, seoData) => {
    try {
      // Only send SEO-relevant fields to prevent overwriting property data
      const payload = {
        seoTitle: seoData.seoTitle ?? '',
        seoDescription: seoData.seoDescription ?? '',
        seoKeywords: seoData.seoKeywords ?? [],
        canonicalUrl: seoData.canonicalUrl ?? '',
        ogTitle: seoData.ogTitle ?? '',
        ogDescription: seoData.ogDescription ?? '',
        ogImage: seoData.ogImage ?? '',
        twitterCard: seoData.twitterCard ?? 'summary_large_image',
        schemaMarkup: seoData.schemaMarkup ?? '',
        updatedAt: new Date().toISOString(),
      };
      const response = await apiClient.patch(`/properties/${id}`, payload);
      return extractSeoFields(response.data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * POST /api/seo/auto-generate
   * Auto-generate SEO data for a single property.
   * In Laravel, this would be a server-side operation.
   * Currently runs client-side via seoGenerator utility.
   */
  autoGenerate: async (propertyId, generatorFn) => {
    try {
      const response = await apiClient.get(`/properties/${propertyId}`);
      const property = response.data;
      const generated = generatorFn(property);
      return seoService.updatePropertySeo(propertyId, generated);
    } catch (error) {
      throw error;
    }
  },

  /**
   * POST /api/seo/bulk-auto-generate
   * Auto-generate SEO for all properties missing complete data.
   * Returns array of updated property SEO records.
   */
  bulkAutoGenerate: async (properties, scoreFn, generatorFn) => {
    const incomplete = properties.filter((p) => scoreFn(p).totalScore < 100);
    if (incomplete.length === 0) return [];

    const updates = [];
    for (const prop of incomplete) {
      const generated = generatorFn(prop);
      // Only fill in missing fields, preserve existing data
      const merged = {
        seoTitle: prop.seoTitle?.trim() ? prop.seoTitle : generated.seoTitle,
        seoDescription: prop.seoDescription?.trim() ? prop.seoDescription : generated.seoDescription,
        seoKeywords: prop.seoKeywords?.length > 0 ? prop.seoKeywords : generated.seoKeywords,
        canonicalUrl: prop.canonicalUrl?.trim() ? prop.canonicalUrl : generated.canonicalUrl,
        ogTitle: prop.ogTitle?.trim() ? prop.ogTitle : generated.ogTitle,
        ogDescription: prop.ogDescription?.trim() ? prop.ogDescription : generated.ogDescription,
        ogImage: prop.ogImage?.trim() ? prop.ogImage : generated.ogImage,
        twitterCard: prop.twitterCard || generated.twitterCard,
        schemaMarkup: prop.schemaMarkup?.trim() ? prop.schemaMarkup : generated.schemaMarkup,
      };
      await seoService.updatePropertySeo(prop.id, merged);
      updates.push({ id: prop.id, ...merged });
    }
    return updates;
  },
};

export default seoService;

/*
 * ══════════════════════════════════════════════════════════════
 * Laravel Migration Guide — SEO Service
 * ══════════════════════════════════════════════════════════════
 *
 * Database Table: seo_properties
 * ──────────────────────────────
 * CREATE TABLE seo_properties (
 *   id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 *   property_id     BIGINT UNSIGNED NOT NULL,
 *   meta_title      VARCHAR(70)    DEFAULT NULL,
 *   meta_description VARCHAR(160)  DEFAULT NULL,
 *   keywords        JSON           DEFAULT NULL,
 *   canonical_url   VARCHAR(500)   DEFAULT NULL,
 *   og_title        VARCHAR(100)   DEFAULT NULL,
 *   og_description  VARCHAR(200)   DEFAULT NULL,
 *   og_image        VARCHAR(500)   DEFAULT NULL,
 *   twitter_card    VARCHAR(30)    DEFAULT 'summary_large_image',
 *   schema_json     JSON           DEFAULT NULL,
 *   seo_score       TINYINT UNSIGNED DEFAULT 0,
 *   created_at      TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
 *   updated_at      TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 *
 *   UNIQUE KEY  uq_property (property_id),
 *   CONSTRAINT  fk_seo_property
 *     FOREIGN KEY (property_id) REFERENCES properties(id)
 *     ON DELETE CASCADE
 * ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
 *
 * Laravel Model:
 * ──────────────
 * class SeoProperty extends Model
 * {
 *     protected $fillable = [
 *         'property_id', 'meta_title', 'meta_description', 'keywords',
 *         'canonical_url', 'og_title', 'og_description', 'og_image',
 *         'twitter_card', 'schema_json', 'seo_score',
 *     ];
 *
 *     protected $casts = [
 *         'keywords'    => 'array',
 *         'schema_json' => 'array',
 *     ];
 *
 *     public function property()
 *     {
 *         return $this->belongsTo(Property::class);
 *     }
 * }
 *
 * Laravel Controller:
 * ───────────────────
 * class SeoController extends Controller
 * {
 *     public function index()
 *     {
 *         return SeoProperty::with('property:id,title,slug,location,developer')
 *             ->paginate(25);
 *     }
 *
 *     public function show($id)
 *     {
 *         return SeoProperty::where('property_id', $id)
 *             ->with('property')
 *             ->firstOrFail();
 *     }
 *
 *     public function update(Request $request, $id)
 *     {
 *         $validated = $request->validate([
 *             'meta_title'      => 'nullable|string|max:70',
 *             'meta_description' => 'nullable|string|max:160',
 *             'keywords'        => 'nullable|array',
 *             'keywords.*'      => 'string|max:50',
 *             'canonical_url'   => 'nullable|url|max:500',
 *             'og_title'        => 'nullable|string|max:100',
 *             'og_description'  => 'nullable|string|max:200',
 *             'og_image'        => 'nullable|url|max:500',
 *             'twitter_card'    => 'nullable|in:summary,summary_large_image',
 *             'schema_json'     => 'nullable|json',
 *         ]);
 *
 *         $seo = SeoProperty::updateOrCreate(
 *             ['property_id' => $id],
 *             $validated
 *         );
 *
 *         // Recalculate score server-side
 *         $seo->seo_score = $this->calculateScore($seo);
 *         $seo->save();
 *
 *         return $seo->load('property');
 *     }
 *
 *     public function autoGenerate(Request $request)
 *     {
 *         $property = Property::findOrFail($request->property_id);
 *         // Server-side generation logic mirrors seoGenerator.js
 *         $seo = SeoProperty::updateOrCreate(
 *             ['property_id' => $property->id],
 *             $this->generateSeoData($property)
 *         );
 *         return $seo->load('property');
 *     }
 * }
 *
 * Routes (api.php):
 * ─────────────────
 * Route::middleware('auth:sanctum')->prefix('seo')->group(function () {
 *     Route::get('/properties',          [SeoController::class, 'index']);
 *     Route::get('/property/{id}',       [SeoController::class, 'show']);
 *     Route::put('/property/{id}',       [SeoController::class, 'update']);
 *     Route::post('/auto-generate',      [SeoController::class, 'autoGenerate']);
 *     Route::post('/bulk-auto-generate', [SeoController::class, 'bulkAutoGenerate']);
 * });
 *
 * ══════════════════════════════════════════════════════════════
 */
