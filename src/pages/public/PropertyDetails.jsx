import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { SwipeableDrawer, useMediaQuery, useTheme } from '@mui/material';
import { propertyService } from '../../services/api';
import { PropertyDetailSkeleton } from '../../components/common/SkeletonLoaders';
import { useToast } from '../../components/common/ToastProvider';
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

const modalVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 350, damping: 30 },
  },
  exit: { opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.2 } },
};

const PropertyDetails = () => {
  const { slug } = useParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const toast = useToast();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);

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
    if (isMobile && navigator.share) {
      navigator.share({
        title: property?.title,
        url: window.location.href,
      }).catch(() => {});
    } else if (isMobile) {
      setShareSheetOpen(true);
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        toast.success('Link copied to clipboard!');
      });
    }
  }, [isMobile, property?.title, toast]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      toast.success('Link copied to clipboard!');
      setShareSheetOpen(false);
    });
  }, [toast]);

  const handleOpenLeadForm = useCallback(() => {
    setShowLeadForm(true);
    const sidebar = document.getElementById('enquiry-sidebar');
    if (sidebar && window.innerWidth > 960) {
      sidebar.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Loading skeleton with shimmer
  if (loading) {
    return <PropertyDetailSkeleton />;
  }

  // 404 / Error state
  if (error || !property) {
    return (
      <div className={styles.errorPage}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Icon icon="mdi:home-search" className={styles.errorIcon} />
          <h1 className={styles.errorTitle}>Property Not Found</h1>
          <p className={styles.errorText}>
            The property you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/properties" className={styles.errorBtn}>
            <Icon icon="mdi:arrow-left" />
            Browse All Properties
          </Link>
        </motion.div>
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

      {/* Lead capture modal overlay — spring animation */}
      <AnimatePresence>
        {showLeadForm && (
          <motion.div
            className={styles.modalOverlay}
            onClick={() => setShowLeadForm(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={styles.modalContent}
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className={styles.modalClose}
                onClick={() => setShowLeadForm(false)}
                aria-label="Close enquiry form"
              >
                <Icon icon="mdi:close" />
              </button>
              <EnquiryForm property={property} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Bottom Sheet (mobile) */}
      {isMobile && (
        <SwipeableDrawer
          anchor="bottom"
          open={shareSheetOpen}
          onClose={() => setShareSheetOpen(false)}
          onOpen={() => setShareSheetOpen(true)}
          disableSwipeToOpen
          PaperProps={{
            sx: {
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              p: 2,
            },
          }}
        >
          <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
            <div style={{ width: 40, height: 4, background: '#D1D5DB', borderRadius: 2, margin: '0 auto 16px' }} />
            <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', marginBottom: 16 }}>
              Share this Property
            </h3>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <button onClick={handleCopyLink} style={shareOptionStyle} aria-label="Copy link">
                <Icon icon="mdi:content-copy" style={{ fontSize: 24 }} />
                <span>Copy Link</span>
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(property.title + ' ' + window.location.href)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={shareOptionStyle}
                aria-label="Share on WhatsApp"
                onClick={() => setShareSheetOpen(false)}
              >
                <Icon icon="mdi:whatsapp" style={{ fontSize: 24, color: '#25D366' }} />
                <span>WhatsApp</span>
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent(property.title)}&body=${encodeURIComponent(window.location.href)}`}
                style={shareOptionStyle}
                aria-label="Share via Email"
                onClick={() => setShareSheetOpen(false)}
              >
                <Icon icon="mdi:email-outline" style={{ fontSize: 24 }} />
                <span>Email</span>
              </a>
            </div>
          </div>
        </SwipeableDrawer>
      )}

      <div className={styles.page}>
        <div className={styles.container}>
          {/* Breadcrumb */}
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
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
              <motion.div
                className={styles.propertyHeader}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
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
                  <button className={styles.shareBtn} onClick={handleShare} aria-label="Share property">
                    <Icon icon="mdi:share-variant" />
                    Share
                  </button>
                </div>
              </motion.div>

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

const shareOptionStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 6,
  padding: '12px 16px',
  border: '1px solid #E5E7EB',
  borderRadius: 12,
  background: '#fff',
  cursor: 'pointer',
  fontFamily: '"DM Sans", sans-serif',
  fontSize: '0.75rem',
  color: '#1B2A4A',
  textDecoration: 'none',
  minWidth: 80,
};

export default PropertyDetails;
