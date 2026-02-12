import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useInView } from 'react-intersection-observer';
import styles from './PropertyOverview.module.css';

const formatPrice = (price, unit) => {
  if (unit === 'per month') return `₹${price.toLocaleString('en-IN')}/mo`;
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
  return `₹${price.toLocaleString('en-IN')}`;
};

const PropertyOverview = ({ property }) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const details = [
    {
      icon: 'mdi:floor-plan',
      label: 'Configuration',
      value: property.configuration?.join(', ') || '—',
    },
    {
      icon: 'mdi:ruler-square',
      label: 'Area Range',
      value: property.dimensionRange
        ? `${property.dimensionRange.min} - ${property.dimensionRange.max} ${property.dimensionRange.unit}`
        : '—',
    },
    {
      icon: 'mdi:currency-inr',
      label: 'Price Range',
      value: property.floorPlans?.length
        ? `${formatPrice(property.floorPlans[0].price, property.priceUnit)} - ${formatPrice(property.floorPlans[property.floorPlans.length - 1].price, property.priceUnit)}`
        : formatPrice(property.price, property.priceUnit),
    },
    {
      icon: 'mdi:calendar-check',
      label: 'Possession Date',
      value: property.possession || '—',
    },
  ];

  return (
    <section className={styles.section} ref={ref} id="overview">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
      >
        <h2 className={styles.title}>Project Overview</h2>

        <p className={styles.description}>{property.description}</p>

        {property.highlights?.length > 0 && (
          <div className={styles.highlights}>
            <h3 className={styles.highlightsTitle}>
              <Icon icon="mdi:star-four-points" className={styles.highlightIcon} />
              Key Reasons This Project Stands Out
            </h3>
            <ul className={styles.highlightsList}>
              {property.highlights.map((item, idx) => (
                <li key={idx} className={styles.highlightItem}>
                  <Icon icon="mdi:check-circle" className={styles.checkIcon} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className={styles.detailsGrid}>
          {details.map((detail, idx) => (
            <div key={idx} className={styles.detailCard}>
              <Icon icon={detail.icon} className={styles.detailIcon} />
              <span className={styles.detailLabel}>{detail.label}</span>
              <span className={styles.detailValue}>{detail.value}</span>
            </div>
          ))}
        </div>

        <div className={styles.developer}>
          <Icon icon="mdi:domain" className={styles.devIcon} />
          <span className={styles.devLabel}>Developer:</span>
          <span className={styles.devName}>{property.developer}</span>
        </div>
      </motion.div>
    </section>
  );
};

export default PropertyOverview;
