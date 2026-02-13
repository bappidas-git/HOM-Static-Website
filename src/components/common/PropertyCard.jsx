import React, { useState, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { useMediaQuery, useTheme } from '@mui/material';
import styles from './PropertyCard.module.css';

const formatPrice = (price, unit) => {
  if (unit === 'per month') {
    return `₹${price.toLocaleString('en-IN')}/mo`;
  }
  if (price >= 10000000) {
    return `₹${(price / 10000000).toFixed(2)} Cr`;
  }
  if (price >= 100000) {
    return `₹${(price / 100000).toFixed(2)} L`;
  }
  return `₹${price.toLocaleString('en-IN')}`;
};

const SWIPE_THRESHOLD = 80;

const PropertyCard = memo(({ property }) => {
  const [currentImg, setCurrentImg] = useState(0);
  const [liked, setLiked] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [swipeAction, setSwipeAction] = useState(null); // 'enquire' | 'share'
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const dragX = useMotionValue(0);
  const swipeBgOpacity = useTransform(dragX, [-120, -60, 0, 60, 120], [1, 0.6, 0, 0.6, 1]);

  const images = property.gallery?.length ? property.gallery : [
    'https://placehold.co/400x280/1B2A4A/white?text=Property',
  ];

  const badge = property.type === 'rent' ? 'For Rent' : 'For Sale';
  const badgeClass = property.type === 'rent' ? styles.badgeRent : styles.badgeSale;

  const handlePrev = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImg((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImg((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setLiked(!liked);
  };

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: property.title,
        url: `${window.location.origin}/properties/${property.slug}`,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(
        `${window.location.origin}/properties/${property.slug}`
      );
    }
    setSwipeAction(null);
  }, [property.title, property.slug]);

  const handleDragEnd = useCallback((_, info) => {
    if (info.offset.x < -SWIPE_THRESHOLD) {
      setSwipeAction('enquire');
      // Auto-dismiss after 2s
      setTimeout(() => setSwipeAction(null), 2000);
    } else if (info.offset.x > SWIPE_THRESHOLD) {
      handleShare();
    }
  }, [handleShare]);

  const cardContent = (
    <>
      <div className={styles.imageWrapper}>
        {/* Image with fade-in on load */}
        <img
          src={images[currentImg]}
          alt={property.title}
          className={styles.image}
          loading="lazy"
          style={{
            opacity: imageLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
          onLoad={() => setImageLoaded(true)}
        />
        {!imageLoaded && <div className={styles.imagePlaceholder} />}

        <span className={`${styles.badge} ${badgeClass}`}>{badge}</span>

        <button
          className={styles.heartBtn}
          onClick={handleLike}
          aria-label={liked ? 'Remove from favourites' : 'Add to favourites'}
        >
          <Icon
            icon={liked ? 'mdi:heart' : 'mdi:heart-outline'}
            className={liked ? styles.heartFilled : styles.heartEmpty}
          />
        </button>

        {images.length > 1 && (
          <>
            <button className={`${styles.navBtn} ${styles.navPrev}`} onClick={handlePrev} aria-label="Previous image">
              <Icon icon="mdi:chevron-left" />
            </button>
            <button className={`${styles.navBtn} ${styles.navNext}`} onClick={handleNext} aria-label="Next image">
              <Icon icon="mdi:chevron-right" />
            </button>
            <div className={styles.dots}>
              {images.map((_, idx) => (
                <span
                  key={idx}
                  className={`${styles.dot} ${idx === currentImg ? styles.dotActive : ''}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className={styles.body}>
        <Link to={`/properties/${property.slug}`} className={styles.name}>
          {property.title}
        </Link>

        <div className={styles.price}>
          {formatPrice(property.price, property.priceUnit)}{' '}
          <span className={styles.priceUnit}>{property.priceUnit}</span>
        </div>

        <div className={styles.location}>
          <Icon icon="mdi:map-marker-outline" className={styles.locIcon} />
          <span>{property.location?.area}, {property.location?.city}</span>
        </div>

        <div className={styles.detailsGrid}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Configuration</span>
            <span className={styles.detailValue}>
              {property.configuration?.join(', ')}
            </span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Area</span>
            <span className={styles.detailValue}>
              {property.dimensionRange
                ? `${property.dimensionRange.min} - ${property.dimensionRange.max} ${property.dimensionRange.unit}`
                : '—'}
            </span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Possession</span>
            <span className={styles.detailValue}>{property.possession}</span>
          </div>
        </div>
      </div>
    </>
  );

  // On mobile, wrap with swipe gesture support
  if (isMobile) {
    return (
      <div className={styles.swipeContainer}>
        {/* Swipe background indicators */}
        <motion.div className={styles.swipeBg} style={{ opacity: swipeBgOpacity }}>
          <div className={styles.swipeLeft}>
            <Icon icon="mdi:message-text-outline" />
            <span>Enquire</span>
          </div>
          <div className={styles.swipeRight}>
            <Icon icon="mdi:share-variant" />
            <span>Share</span>
          </div>
        </motion.div>

        <motion.div
          className={styles.card}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.3}
          onDragEnd={handleDragEnd}
          style={{ x: dragX }}
          whileTap={{ scale: 0.98 }}
        >
          {cardContent}
        </motion.div>

        {/* Swipe action toast */}
        <AnimatePresence>
          {swipeAction === 'enquire' && (
            <motion.div
              className={styles.swipeToast}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <Link
                to={`/properties/${property.slug}`}
                className={styles.swipeToastLink}
                onClick={() => setSwipeAction(null)}
              >
                <Icon icon="mdi:message-text-outline" /> Enquire Now
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return <div className={styles.card}>{cardContent}</div>;
});

PropertyCard.displayName = 'PropertyCard';

export default PropertyCard;
