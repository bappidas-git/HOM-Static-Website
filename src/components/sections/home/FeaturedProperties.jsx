import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Icon } from '@iconify/react';
import { propertyService } from '../../../services/api';
import PropertyCard from '../../common/PropertyCard';
import styles from './FeaturedProperties.module.css';

const AUTO_SCROLL_SPEED = 0.5; // px per frame — smooth and unobtrusive
const PAUSE_AFTER_MANUAL = 3000; // ms to pause auto-scroll after manual interaction

const FeaturedProperties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const trackRef = useRef(null);
  const rafRef = useRef(null);
  const offsetRef = useRef(0);
  const isPausedRef = useRef(false);
  const pauseTimerRef = useRef(null);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const data = await propertyService.getFeatured();
        setProperties(data);
      } catch {
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  // Infinite auto-scroll via CSS transform for jitter-free animation
  const startAutoScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const animate = () => {
      if (!isPausedRef.current) {
        offsetRef.current += AUTO_SCROLL_SPEED;
        // Each "set" of items is half the total width (original items)
        const halfWidth = track.scrollWidth / 2;
        if (halfWidth > 0 && offsetRef.current >= halfWidth) {
          offsetRef.current -= halfWidth;
        }
        track.style.transform = `translateX(-${offsetRef.current}px)`;
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (properties.length > 0 && !loading) {
      startAutoScroll();
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    };
  }, [properties, loading, startAutoScroll]);

  const handleMouseEnter = () => {
    isPausedRef.current = true;
  };

  const handleMouseLeave = () => {
    isPausedRef.current = false;
  };

  const handleTouchStart = () => {
    isPausedRef.current = true;
  };

  const handleTouchEnd = () => {
    // Resume after a brief delay on touch devices
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => {
      isPausedRef.current = false;
    }, PAUSE_AFTER_MANUAL);
  };

  // Duplicate items for seamless infinite loop
  const displayItems = properties.length > 0
    ? [...properties, ...properties]
    : [];

  return (
    <section className={styles.section} ref={ref}>
      <div className={styles.container}>
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <h2 className={styles.title}>Featured Properties</h2>
          <p className={styles.subtitle}>
            Explore our handpicked selection of premium properties
          </p>
        </motion.div>

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
          </div>
        ) : properties.length > 0 ? (
          <motion.div
            className={styles.carouselViewport}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className={styles.carouselTrack} ref={trackRef}>
              {displayItems.map((property, index) => (
                <div key={`${property.id}-${index}`} className={styles.scrollItem}>
                  <PropertyCard property={property} />
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className={styles.emptyState}>
            <Icon icon="mdi:home-search-outline" className={styles.emptyIcon} />
            <p className={styles.emptyText}>No featured properties available at this time.</p>
          </div>
        )}

        <div className={styles.cta}>
          <Link to="/properties" className={styles.ctaBtn}>
            View All Properties
            <Icon icon="mdi:arrow-right" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProperties;
