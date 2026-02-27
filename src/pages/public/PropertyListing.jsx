import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { propertyService } from '../../services/api';
import PropertyCard from '../../components/common/PropertyCard';
import PropertyFilters from '../../components/common/PropertyFilters';
import RentCTA from '../../components/common/RentCTA';
import { PropertyGridSkeleton } from '../../components/common/SkeletonLoaders';
import styles from './PropertyListing.module.css';

const ITEMS_PER_PAGE = 9;

const SALE_PRICE_RANGES_MAP = {
  '0-5000000': { min: 0, max: 5000000 },
  '5000000-10000000': { min: 5000000, max: 10000000 },
  '10000000-20000000': { min: 10000000, max: 20000000 },
  '20000000-50000000': { min: 20000000, max: 50000000 },
  '50000000-Infinity': { min: 50000000, max: Infinity },
};

const RENT_PRICE_RANGES_MAP = {
  '0-25000': { min: 0, max: 25000 },
  '25000-50000': { min: 25000, max: 50000 },
  '50000-100000': { min: 50000, max: 100000 },
  '100000-200000': { min: 100000, max: 200000 },
  '200000-Infinity': { min: 200000, max: Infinity },
};

// Route configuration for different listing pages
const ROUTE_CONFIG = {
  '/properties': {
    title: 'Property Listings',
    subtitle: 'Browse our exclusive collection of premium properties',
    seoTitle: 'Property Listings | H.O.M Advisory',
    preFilters: {},
  },
  '/buy/pre-launch': {
    title: 'Pre-Launch Properties',
    subtitle: 'Discover upcoming premium properties before they hit the market',
    seoTitle: 'Pre-Launch Properties | H.O.M Advisory',
    preFilters: { status: 'pre-launch', type: 'sale' },
  },
  '/buy/under-construction': {
    title: 'Under Construction Properties',
    subtitle: 'Invest early in premium properties currently under development',
    seoTitle: 'Under Construction Properties | H.O.M Advisory',
    preFilters: { status: 'under-construction', type: 'sale' },
  },
  '/buy/ready-to-move': {
    title: 'Ready to Move Properties',
    subtitle: 'Move into your dream home right away with our ready properties',
    seoTitle: 'Ready to Move Properties | H.O.M Advisory',
    preFilters: { status: 'ready-to-move', type: 'sale' },
  },
  '/rent/apartments': {
    title: 'Apartments for Rent',
    subtitle: 'Find the perfect apartment to rent from our premium collection',
    seoTitle: 'Apartments for Rent | H.O.M Advisory',
    preFilters: { propertyType: 'apartment', type: 'rent' },
  },
  '/rent/villas': {
    title: 'Villas for Rent',
    subtitle: 'Explore luxurious villas available for rent',
    seoTitle: 'Villas for Rent | H.O.M Advisory',
    preFilters: { propertyType: 'villa', type: 'rent' },
  },
};

// Generate config for dynamic /rent/:category routes not explicitly listed
const getDynamicRentConfig = (category) => {
  const label = category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ');
  return {
    title: `${label} for Rent`,
    subtitle: `Browse ${label.toLowerCase()} properties available for rent`,
    seoTitle: `${label} for Rent | H.O.M Advisory`,
    preFilters: { propertyType: category, type: 'rent' },
  };
};

const PropertyListing = ({ routePath }) => {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const currentPath = routePath || location.pathname;
  // Try static config first, then dynamic rent category, then fallback to /properties
  const baseConfig = ROUTE_CONFIG[currentPath]
    || (currentPath.startsWith('/rent/') ? getDynamicRentConfig(currentPath.replace('/rent/', '')) : null)
    || ROUTE_CONFIG['/properties'];

  // Dynamic config override based on URL type param (for homepage category card links)
  const TYPE_LABELS = {
    sale: { title: 'Properties for Sale', subtitle: 'Explore premium properties available for purchase', seoTitle: 'Properties for Sale | H.O.M Advisory' },
    rent: { title: 'Properties for Rent', subtitle: 'Find rental properties with flexible terms and premium amenities', seoTitle: 'Properties for Rent | H.O.M Advisory' },
    lease: { title: 'Commercial Spaces for Lease', subtitle: 'Discover premium commercial and office spaces for your business', seoTitle: 'Office Spaces for Lease | H.O.M Advisory' },
  };

  const urlType = searchParams.get('type');
  const typeOverride = urlType && !baseConfig.preFilters.type ? TYPE_LABELS[urlType] : null;
  const config = typeOverride ? { ...baseConfig, ...typeOverride, preFilters: baseConfig.preFilters } : baseConfig;

  // Extract URL param values as stable primitives for hook dependencies.
  // Using the searchParams object directly in useCallback/useMemo deps can cause
  // infinite re-renders because URLSearchParams doesn't have referential stability.
  const urlSearchQuery = searchParams.get('q') || '';
  const urlArea = searchParams.get('area') || '';
  const urlBhk = searchParams.get('bhk') || '';
  const urlPriceRange = searchParams.get('priceRange') || '';
  const urlLocations = searchParams.get('locations') || '';
  const urlPropertyType = searchParams.get('propertyType') || '';
  const urlStatus = searchParams.get('status') || '';
  const urlDeveloper = searchParams.get('developer') || '';
  const urlSort = searchParams.get('sort') || '';

  const isRentPage = config.preFilters.type === 'rent';
  const priceRangesMap = isRentPage ? RENT_PRICE_RANGES_MAP : SALE_PRICE_RANGES_MAP;

  const [allProperties, setAllProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // Initialize filters from URL params + pre-filters
  const initFilters = useCallback(() => {
    return {
      bhk: urlBhk ? urlBhk.split(',') : [],
      priceRange: urlPriceRange,
      locations: urlLocations ? urlLocations.split(',') : [],
      propertyType: urlPropertyType,
      status: urlStatus,
      developer: urlDeveloper,
      ...config.preFilters,
    };
  }, [urlBhk, urlPriceRange, urlLocations, urlPropertyType, urlStatus, urlDeveloper, config.preFilters]);

  const [filters, setFilters] = useState(initFilters);
  const [sortBy, setSortBy] = useState(urlSort);

  // Fetch all properties
  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = { isActive: true };

      // Apply pre-filters as API params
      if (config.preFilters.type) {
        params.type = config.preFilters.type;
      }
      if (config.preFilters.status) {
        params.status = config.preFilters.status;
      }
      if (config.preFilters.propertyType) {
        params.propertyType = config.preFilters.propertyType;
      }

      // Apply type filter from URL param (used by category cards on homepage)
      if (urlType && !config.preFilters.type) {
        params.type = urlType;
      }

      // Search query from URL
      if (urlSearchQuery) {
        params.q = urlSearchQuery;
      }

      // Area filter from URL (from neighborhood links)
      // Handled via client-side filtering for backend-agnostic compatibility

      const data = await propertyService.getAll(params);
      setAllProperties(data);
    } catch (err) {
      setError('Failed to load properties. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [config.preFilters, urlType, urlSearchQuery]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Re-init filters when route changes
  useEffect(() => {
    setFilters(initFilters());
    setPage(1);
  }, [currentPath, initFilters]);

  // Client-side filtering
  const filteredProperties = useMemo(() => {
    let result = [...allProperties];

    // Area filter from URL (from neighborhood links) — client-side for backend-agnostic compatibility
    if (urlArea) {
      result = result.filter((p) =>
        p.location?.area?.toLowerCase().includes(urlArea.toLowerCase())
      );
    }

    // BHK filter
    if (filters.bhk && filters.bhk.length > 0) {
      result = result.filter((p) => {
        if (!Array.isArray(p.configuration)) return false;
        return filters.bhk.some((bhk) =>
          p.configuration.some((c) => c && typeof c === 'string' && c.toLowerCase().includes(bhk.toLowerCase()))
        );
      });
    }

    // Price range filter
    if (filters.priceRange) {
      const range = priceRangesMap[filters.priceRange];
      if (range) {
        result = result.filter(
          (p) => p.price >= range.min && p.price < range.max
        );
      }
    }

    // Location filter
    if (filters.locations && filters.locations.length > 0) {
      result = result.filter((p) =>
        filters.locations.some(
          (loc) => p.location?.area?.toLowerCase().includes(loc.toLowerCase())
        )
      );
    }

    // Property type filter (only if not already a pre-filter)
    if (filters.propertyType && !config.preFilters.propertyType) {
      result = result.filter((p) => p.propertyType === filters.propertyType);
    }

    // Status filter (only if not already a pre-filter)
    if (filters.status && !config.preFilters.status) {
      result = result.filter((p) => p.status === filters.status);
    }

    // Developer filter
    if (filters.developer) {
      result = result.filter((p) =>
        p.developer?.toLowerCase().includes(filters.developer.toLowerCase())
      );
    }

    return result;
  }, [allProperties, filters, config.preFilters, urlArea, priceRangesMap]);

  // Sorting
  const sortedProperties = useMemo(() => {
    const sorted = [...filteredProperties];
    switch (sortBy) {
      case 'price-asc':
        sorted.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
        break;
      case 'price-desc':
        sorted.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
        break;
      case 'newest':
        sorted.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
        });
        break;
      case 'possession':
        sorted.sort((a, b) => {
          const dateA = a.specifications?.possessionDate
            ? new Date(a.specifications.possessionDate)
            : new Date('2099-01-01');
          const dateB = b.specifications?.possessionDate
            ? new Date(b.specifications.possessionDate)
            : new Date('2099-01-01');
          return dateA - dateB;
        });
        break;
      default:
        break;
    }
    return sorted;
  }, [filteredProperties, sortBy]);

  // Pagination
  const paginatedProperties = useMemo(() => {
    return sortedProperties.slice(0, page * ITEMS_PER_PAGE);
  }, [sortedProperties, page]);

  const hasMore = paginatedProperties.length < sortedProperties.length;

  const handleLoadMore = () => {
    setLoadingMore(true);
    // Small delay for UX
    setTimeout(() => {
      setPage((prev) => prev + 1);
      setLoadingMore(false);
    }, 300);
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleClearFilters = () => {
    const cleared = {
      bhk: [],
      priceRange: '',
      locations: [],
      propertyType: '',
      status: '',
      developer: '',
      ...config.preFilters,
    };
    setFilters(cleared);
    setPage(1);
  };

  // Animation variants for staggered grid items
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.05, duration: 0.3, ease: 'easeOut' },
    }),
  };

  return (
    <>
      <Helmet>
        <title>{config.seoTitle}</title>
        <meta name="description" content={config.subtitle} />
      </Helmet>

      {/* Page Header */}
      <motion.div
        className={styles.pageHeader}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className={styles.headerContainer}>
          <h1 className={styles.pageTitle}>{config.title}</h1>
          <p className={styles.pageSubtitle}>{config.subtitle}</p>
          <div className={styles.divider} />
        </div>
      </motion.div>

      {/* Main Content */}
      <section className={styles.section}>
        <div className={styles.container}>
          {/* Rent CTA — shown only on rent listing pages */}
          {config.preFilters.type === 'rent' && <RentCTA />}

          {/* Filters */}
          <PropertyFilters
            properties={allProperties}
            totalCount={sortedProperties.length}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            sortBy={sortBy}
            onSortChange={setSortBy}
            preFilters={config.preFilters}
          />

          {/* Loading State — branded shimmer skeletons */}
          {loading && <PropertyGridSkeleton count={6} />}

          {/* Error State */}
          {error && !loading && (
            <div className={styles.errorState}>
              <Icon icon="mdi:alert-circle-outline" className={styles.errorIcon} />
              <p className={styles.emptyTitle}>{error}</p>
              <button
                className={styles.retryBtn}
                onClick={fetchProperties}
                type="button"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && sortedProperties.length === 0 && (
            <div className={styles.emptyState}>
              <Icon icon="mdi:home-search-outline" className={styles.emptyIcon} />
              <h3 className={styles.emptyTitle}>No properties found</h3>
              <p className={styles.emptyText}>
                No properties found matching your criteria. Try adjusting your
                filters or clearing them to see all available properties.
              </p>
              <button
                className={styles.clearFiltersBtn}
                onClick={handleClearFilters}
                type="button"
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* Property Grid */}
          {!loading && !error && sortedProperties.length > 0 && (
            <>
              <div className={styles.propertyGrid}>
                {paginatedProperties.map((property, index) => (
                  <motion.div
                    key={property.id}
                    custom={index % ITEMS_PER_PAGE}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <PropertyCard property={property} />
                  </motion.div>
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className={styles.loadMoreWrapper}>
                  <button
                    className={styles.loadMoreBtn}
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    type="button"
                  >
                    {loadingMore ? 'Loading...' : 'Load More Properties'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
};

export default PropertyListing;
