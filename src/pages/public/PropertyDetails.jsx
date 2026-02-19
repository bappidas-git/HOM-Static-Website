import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { SwipeableDrawer, useMediaQuery, useTheme } from '@mui/material';
import { propertyService, leadService } from '../../services/api';
import { PropertyDetailSkeleton } from '../../components/common/SkeletonLoaders';
import { useToast } from '../../components/common/ToastProvider';
import PropertyGallery from '../../components/sections/property/PropertyGallery';
import PropertyOverview from '../../components/sections/property/PropertyOverview';
import PropertySpecs from '../../components/sections/property/PropertySpecs';
import PropertySpecialities from '../../components/sections/property/PropertySpecialities';
import PropertyAmenities from '../../components/sections/property/PropertyAmenities';
import FloorPlans from '../../components/sections/property/FloorPlans';
import FinanceGuide from '../../components/sections/property/FinanceGuide';
import NearbyPlaces from '../../components/sections/property/NearbyPlaces';
import PropertyDocuments from '../../components/sections/property/PropertyDocuments';
import ConstructionSpecs from '../../components/sections/property/ConstructionSpecs';
import ConstructionStatus from '../../components/sections/property/ConstructionStatus';
import BuilderOverview from '../../components/sections/property/BuilderOverview';
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

  // Download lead capture modal state
  const [downloadModal, setDownloadModal] = useState({ open: false, type: '' });
  const [downloadFormData, setDownloadFormData] = useState({ name: '', email: '', phone: '' });
  const [downloadSubmitting, setDownloadSubmitting] = useState(false);
  const [downloadSubmitted, setDownloadSubmitted] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  // Document download lead capture modal state
  const [docModal, setDocModal] = useState({ open: false, docName: '' });
  const [docFormData, setDocFormData] = useState({ name: '', email: '', phone: '' });
  const [docSubmitting, setDocSubmitting] = useState(false);
  const [docSubmitted, setDocSubmitted] = useState(false);
  const [docError, setDocError] = useState('');

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

  // Download modal handlers
  const openDownloadModal = useCallback((type) => {
    setDownloadModal({ open: true, type });
    setDownloadSubmitted(false);
    setDownloadError('');
    setDownloadFormData({ name: '', email: '', phone: '' });
  }, []);

  const closeDownloadModal = useCallback(() => {
    setDownloadModal({ open: false, type: '' });
    setDownloadSubmitted(false);
    setDownloadError('');
  }, []);

  const handleDownloadFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setDownloadFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleDownloadSubmit = useCallback(async (e) => {
    e.preventDefault();
    setDownloadError('');

    if (!downloadFormData.name.trim() || !downloadFormData.phone.trim()) {
      setDownloadError('Name and phone are required');
      return;
    }

    try {
      setDownloadSubmitting(true);
      await leadService.create({
        ...downloadFormData,
        propertyId: property?.id || null,
        source: downloadModal.type === 'brochure' ? 'brochure_download' : 'floorplan_download',
      });
      setDownloadSubmitted(true);
      toast.success('Request submitted successfully!');
    } catch {
      setDownloadError('Something went wrong. Please try again.');
    } finally {
      setDownloadSubmitting(false);
    }
  }, [downloadFormData, downloadModal.type, property?.id, toast]);

  // Document download modal handlers
  const openDocModal = useCallback((docName) => {
    setDocModal({ open: true, docName });
    setDocSubmitted(false);
    setDocError('');
    setDocFormData({ name: '', email: '', phone: '' });
  }, []);

  const closeDocModal = useCallback(() => {
    setDocModal({ open: false, docName: '' });
    setDocSubmitted(false);
    setDocError('');
  }, []);

  const handleDocFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setDocFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleDocSubmit = useCallback(async (e) => {
    e.preventDefault();
    setDocError('');

    if (!docFormData.name.trim() || !docFormData.phone.trim()) {
      setDocError('Name and phone are required');
      return;
    }

    try {
      setDocSubmitting(true);
      await leadService.create({
        ...docFormData,
        propertyId: property?.id || null,
        source: 'document_download',
        message: `Requested document: ${docModal.docName}`,
      });
      setDocSubmitted(true);
      toast.success('Request submitted successfully!');
    } catch {
      setDocError('Something went wrong. Please try again.');
    } finally {
      setDocSubmitting(false);
    }
  }, [docFormData, docModal.docName, property?.id, toast]);

  // Loading skeleton
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

  const downloadModalTitle = downloadModal.type === 'brochure'
    ? `Download Brochure — ${property.title}`
    : `Download Floor Plans — ${property.title}`;

  const thankYouMessage = downloadModal.type === 'brochure'
    ? 'Your brochure download request has been received. Our team will share the brochure with you shortly.'
    : 'Your floor plan request has been received. Our team will share the detailed floor plans with you shortly.';

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

      {/* Download Lead Capture Modal */}
      <AnimatePresence>
        {downloadModal.open && (
          <motion.div
            className={styles.modalOverlay}
            onClick={closeDownloadModal}
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
                onClick={closeDownloadModal}
                aria-label="Close download form"
              >
                <Icon icon="mdi:close" />
              </button>

              {downloadSubmitted ? (
                <div className={styles.thankYou}>
                  <Icon icon="mdi:check-circle" className={styles.thankYouIcon} />
                  <h3 className={styles.thankYouTitle}>Thank You!</h3>
                  <p className={styles.thankYouText}>{thankYouMessage}</p>
                  <button className={styles.thankYouClose} onClick={closeDownloadModal}>
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <h3 className={styles.modalTitle}>{downloadModalTitle}</h3>
                  <form onSubmit={handleDownloadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <input
                      type="text"
                      name="name"
                      placeholder="Your Name *"
                      value={downloadFormData.name}
                      onChange={handleDownloadFormChange}
                      required
                      style={inputStyle}
                    />
                    <input
                      type="email"
                      name="email"
                      placeholder="Email Address"
                      value={downloadFormData.email}
                      onChange={handleDownloadFormChange}
                      style={inputStyle}
                    />
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Phone Number *"
                      value={downloadFormData.phone}
                      onChange={handleDownloadFormChange}
                      required
                      style={inputStyle}
                    />
                    {downloadError && (
                      <p style={{ color: '#dc2626', fontSize: '0.8rem', fontFamily: '"DM Sans", sans-serif' }}>
                        {downloadError}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={downloadSubmitting}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        width: '100%',
                        padding: '12px',
                        background: downloadModal.type === 'brochure' ? '#C9A86C' : '#1B2A4A',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        cursor: downloadSubmitting ? 'not-allowed' : 'pointer',
                        opacity: downloadSubmitting ? 0.7 : 1,
                      }}
                    >
                      {downloadSubmitting ? 'Submitting...' : (
                        <>
                          <Icon icon="mdi:download" />
                          {downloadModal.type === 'brochure' ? 'Get Brochure' : 'Get Floor Plans'}
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Document Download Lead Capture Modal */}
      <AnimatePresence>
        {docModal.open && (
          <motion.div
            className={styles.modalOverlay}
            onClick={closeDocModal}
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
                onClick={closeDocModal}
                aria-label="Close document download form"
              >
                <Icon icon="mdi:close" />
              </button>

              {docSubmitted ? (
                <div className={styles.thankYou}>
                  <Icon icon="mdi:check-circle" className={styles.thankYouIcon} />
                  <h3 className={styles.thankYouTitle}>Thank You!</h3>
                  <p className={styles.thankYouText}>
                    Your request for "{docModal.docName}" has been received. Our team will share the document with you shortly.
                  </p>
                  <button className={styles.thankYouClose} onClick={closeDocModal}>
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <h3 className={styles.modalTitle}>
                    Download {docModal.docName}
                  </h3>
                  <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8rem', color: '#6B7280', marginBottom: '16px', lineHeight: 1.5 }}>
                    Please share your details to receive the document.
                  </p>
                  <form onSubmit={handleDocSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <input
                      type="text"
                      name="name"
                      placeholder="Your Name *"
                      value={docFormData.name}
                      onChange={handleDocFormChange}
                      required
                      style={inputStyle}
                    />
                    <input
                      type="email"
                      name="email"
                      placeholder="Email Address"
                      value={docFormData.email}
                      onChange={handleDocFormChange}
                      style={inputStyle}
                    />
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Phone Number *"
                      value={docFormData.phone}
                      onChange={handleDocFormChange}
                      required
                      style={inputStyle}
                    />
                    {docError && (
                      <p style={{ color: '#dc2626', fontSize: '0.8rem', fontFamily: '"DM Sans", sans-serif' }}>
                        {docError}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={docSubmitting}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        width: '100%',
                        padding: '12px',
                        background: '#1B2A4A',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        cursor: docSubmitting ? 'not-allowed' : 'pointer',
                        opacity: docSubmitting ? 0.7 : 1,
                      }}
                    >
                      {docSubmitting ? 'Submitting...' : (
                        <>
                          <Icon icon="mdi:download" />
                          Get Document
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
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

          {/* Download Buttons - below gallery */}
          <div className={styles.downloadButtons}>
            <button
              className={`${styles.downloadBtn} ${styles.downloadBrochure}`}
              onClick={() => openDownloadModal('brochure')}
            >
              <Icon icon="mdi:download" /> Download Brochure
            </button>
            <button
              className={`${styles.downloadBtn} ${styles.downloadFloorPlan}`}
              onClick={() => openDownloadModal('floorplan')}
            >
              <Icon icon="mdi:floor-plan" /> Download Floor Plans
            </button>
          </div>

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
                  <button className={styles.ctaPrimary} onClick={() => openDownloadModal('brochure')}>
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

              {/* Sections — ordered per mockup */}
              <PropertyOverview property={property} />
              <PropertySpecs specifications={property.specifications} propertyType={property.propertyType} />
              <PropertySpecialities specialities={property.specialities} />
              <PropertyAmenities amenities={property.amenities} />
              <FloorPlans
                floorPlans={property.floorPlans}
                priceUnit={property.priceUnit}
                onRequestDetails={() => setShowLeadForm(true)}
              />
              <FinanceGuide price={property.price} property={property} />
              <NearbyPlaces nearbyPlaces={property.nearbyPlaces} />
              <PropertyDocuments documents={property.documents} onDownloadClick={openDocModal} />
              <ConstructionSpecs constructionSpecs={property.constructionSpecs} />
              <ConstructionStatus status={property.status} />
              <BuilderOverview developer={property.developer} />
              <PropertyFaq property={property} />
            </div>

            {/* Sidebar — sticky on desktop */}
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

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  border: '1.5px solid #E5E7EB',
  borderRadius: '8px',
  fontFamily: '"DM Sans", sans-serif',
  fontSize: '0.875rem',
  color: '#1B2A4A',
  outline: 'none',
  background: '#fff',
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
