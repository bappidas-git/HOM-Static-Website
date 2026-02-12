import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
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

const PropertyCard = ({ property }) => {
  const [currentImg, setCurrentImg] = useState(0);
  const [liked, setLiked] = useState(false);

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

  return (
    <div className={styles.card}>
      <div className={styles.imageWrapper}>
        <img
          src={images[currentImg]}
          alt={property.title}
          className={styles.image}
          loading="lazy"
        />

        <span className={`${styles.badge} ${badgeClass}`}>{badge}</span>

        <button
          className={styles.heartBtn}
          onClick={handleLike}
          aria-label="Favourite"
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
    </div>
  );
};

export default PropertyCard;
