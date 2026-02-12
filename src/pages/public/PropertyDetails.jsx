import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { Skeleton } from '@mui/material';
import { propertyService } from '../../services/api';
import PropertyGallery from '../../components/sections/property/PropertyGallery';
import PropertyOverview from '../../components/sections/property/PropertyOverview';
import PropertySpecs from '../../components/sections/property/PropertySpecs';
import PropertyAmenities from '../../components/sections/property/PropertyAmenities';
import FloorPlans from '../../components/sections/property/FloorPlans';
import FinanceGuide from '../../components/sections/property/FinanceGuide';
import NearbyPlaces from '../../components/sections/property/NearbyPlaces';
import BuilderOverview from '../../components/sections/property/BuilderOverview';
import ConstructionStatus from '../../components/sections/property/ConstructionStatus';
import EnquiryForm from '../../components/sections/property/EnquiryForm';
import PropertyFaq from '../../components/sections/property/PropertyFaq';
import SimilarProperties from '../../components/sections/property/SimilarProperties';
import styles from './PropertyDetails.module.css';

const formatPrice = (price, unit) => {
  if (unit === 'per month') return `₹${price.toLocaleString('en-IN')}/mo`;
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
  return `₹${price.toLocaleString('en-IN')}`;
};

const PropertyDetails = () => {
  const { slug } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        setError(false);
        const data = await propertyService.getBySlug(slug);
        if (!data) {
          setError(true);
        } else {
          setProperty(data);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
    window.scrollTo(0, 0);
  }, [slug]);

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  const handleOpenLeadForm = useCallback(() => {
    setShowLeadForm(true);
    // On desktop, scroll to the sidebar form
    const sidebar = document.getElementById('enquiry-sidebar');
    if (sidebar && window.innerWidth > 960) {
      sidebar.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Loading skeleton
  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.skeletonBreadcrumb}>
            <Skeleton variant="text" width={200} height={20} />
          </div>
          <Skeleton variant="rectangular" width="100%" sx={{ aspectRatio: '16/9', borderRadius: '12px' }} />
          <div style={{ marginTop: 24 }}>
            <Skeleton variant="text" width="60%" height={40} />
            <Skeleton variant="text" width="30%" height={28} />
            <Skeleton variant="text" width="40%" height={24} />
          </div>
          <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={80} sx={{ borderRadius: '8px' }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 404 state
  if (error || !property) {
    return (
      <div className={styles.errorPage}>
        <Icon icon="mdi:home-search" className={styles.errorIcon} />
        <h1 className={styles.errorTitle}>Property Not Found</h1>
        <p className={styles.errorText}>
          The property you're looking for doesn't exist or has been removed.
        </p>
        <Link to="/properties" className={styles.errorBtn}>
          <Icon icon="mdi:arrow-left" />
          Browse All Properties
        </Link>
      </div>
    );
  }

  const badge = property.type === 'rent' ? 'For Rent' : 'For Sale';
  const badgeClass = property.type === 'rent' ? styles.badgeRent : styles.badgeSale;

  return (
    <>
      <Helmet>
        <title>{property.seoTitle || property.title}</title>
        <meta name="description" content={property.seoDescription || property.description} />
        {property.seoKeywords && (
          <meta name="keywords" content={property.seoKeywords.join(', ')} />
        )}
        {property.schemaMarkup && (
          <script type="application/ld+json">{property.schemaMarkup}</script>
        )}
      </Helmet>

      {/* Lead capture modal overlay */}
      {showLeadForm && (
        <div className={styles.modalOverlay} onClick={() => setShowLeadForm(false)}>
          <motion.div
            className={styles.modalContent}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className={styles.modalClose} onClick={() => setShowLeadForm(false)}>
              <Icon icon="mdi:close" />
            </button>
            <EnquiryForm property={property} />
          </motion.div>
        </div>
      )}

      <div className={styles.page}>
        <div className={styles.container}>
          {/* Breadcrumb */}
          <nav className={styles.breadcrumb}>
            <Link to="/" className={styles.breadcrumbLink}>Home</Link>
            <Icon icon="mdi:chevron-right" className={styles.breadcrumbSep} />
            <Link to="/properties" className={styles.breadcrumbLink}>Properties</Link>
            <Icon icon="mdi:chevron-right" className={styles.breadcrumbSep} />
            <span className={styles.breadcrumbCurrent}>{property.title}</span>
          </nav>

          {/* Gallery */}
          <PropertyGallery images={property.gallery} />

          {/* Main content + sidebar layout */}
          <div className={styles.layout}>
            <div className={styles.mainContent}>
              {/* Property Header */}
              <div className={styles.propertyHeader}>
                <div className={styles.headerTop}>
                  <div>
                    <h1 className={styles.propertyName}>{property.title}</h1>
                    <span className={`${styles.badge} ${badgeClass}`}>{badge}</span>
                  </div>
                  <div className={styles.priceBlock}>
                    <span className={styles.price}>
                      {formatPrice(property.price, property.priceUnit)}
                    </span>
                    <span className={styles.priceUnit}>{property.priceUnit}</span>
                  </div>
                </div>

                <div className={styles.locationRow}>
                  <Icon icon="mdi:map-marker" className={styles.locationIcon} />
                  <span>{property.location?.area}, {property.location?.city}</span>
                </div>

                <div className={styles.quickChips}>
                  {property.configuration?.map((config, idx) => (
                    <span key={idx} className={styles.chip}>
                      <Icon icon="mdi:floor-plan" /> {config}
                    </span>
                  ))}
                  {property.dimensionRange && (
                    <span className={styles.chip}>
                      <Icon icon="mdi:ruler-square" />
                      {property.dimensionRange.min} - {property.dimensionRange.max} {property.dimensionRange.unit}
                    </span>
                  )}
                  <span className={styles.chip}>
                    <Icon icon="mdi:calendar-clock" /> {property.possession}
                  </span>
                </div>

                <div className={styles.headerActions}>
                  <button className={styles.ctaPrimary} onClick={() => setShowLeadForm(true)}>
                    <Icon icon="mdi:download" /> Download Brochure
                  </button>
                  <button className={styles.ctaSecondary} onClick={() => setShowLeadForm(true)}>
                    <Icon icon="mdi:phone-outline" /> Contact For Price
                  </button>
                  <button className={styles.shareBtn} onClick={handleShare}>
                    <Icon icon={copied ? 'mdi:check' : 'mdi:share-variant'} />
                    {copied ? 'Copied!' : 'Share'}
                  </button>
                </div>
              </div>

              {/* Sections */}
              <PropertyOverview property={property} />
              <PropertySpecs specifications={property.specifications} propertyType={property.propertyType} />
              <PropertyAmenities amenities={property.amenities} />
              <FloorPlans
                floorPlans={property.floorPlans}
                priceUnit={property.priceUnit}
                onRequestDetails={() => setShowLeadForm(true)}
              />
              <FinanceGuide price={property.price} />
              <NearbyPlaces nearbyPlaces={property.nearbyPlaces} />
              <ConstructionStatus status={property.status} />
              <BuilderOverview developer={property.developer} />
              <PropertyFaq property={property} />
            </div>

            {/* Sidebar */}
            <div className={styles.sidebarCol} id="enquiry-sidebar">
              <EnquiryForm property={property} />
            </div>
          </div>

          {/* Similar Properties - full width */}
          <SimilarProperties currentProperty={property} />
        </div>
      </div>

      {/* Mobile Enquiry Button */}
      <EnquiryForm property={property} isMobile />
    </>
  );
};

export default PropertyDetails;
