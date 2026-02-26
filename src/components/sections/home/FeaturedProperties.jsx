import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Icon } from '@iconify/react';
import { propertyService } from '../../../services/api';
import PropertyCard from '../../common/PropertyCard';
import styles from './FeaturedProperties.module.css';

const FeaturedProperties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [properties, loading, updateScrollState]);

  const scroll = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector(`.${styles.scrollItem}`)?.offsetWidth || 360;
    const gap = 24;
    el.scrollBy({
      left: direction === 'left' ? -(cardWidth + gap) : cardWidth + gap,
      behavior: 'smooth',
    });
  };

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
            className={styles.scrollWrapper}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {canScrollLeft && (
              <button
                className={`${styles.scrollArrow} ${styles.scrollArrowLeft}`}
                onClick={() => scroll('left')}
                aria-label="Scroll left"
              >
                <Icon icon="mdi:chevron-left" />
              </button>
            )}

            <div className={styles.scrollRow} ref={scrollRef}>
              {properties.map((property) => (
                <div key={property.id} className={styles.scrollItem}>
                  <PropertyCard property={property} />
                </div>
              ))}
            </div>

            {canScrollRight && (
              <button
                className={`${styles.scrollArrow} ${styles.scrollArrowRight}`}
                onClick={() => scroll('right')}
                aria-label="Scroll right"
              >
                <Icon icon="mdi:chevron-right" />
              </button>
            )}
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
