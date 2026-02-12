import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useInView } from 'react-intersection-observer';
import styles from './PropertyAmenities.module.css';

const PropertyAmenities = ({ amenities = [] }) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  if (amenities.length === 0) return null;

  return (
    <section className={styles.section} ref={ref} id="amenities">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
      >
        <h2 className={styles.title}>Property Amenities</h2>

        <div className={styles.grid}>
          {amenities.map((amenity, idx) => (
            <motion.div
              key={idx}
              className={styles.amenityItem}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.3, delay: idx * 0.04 }}
            >
              <div className={styles.iconWrap}>
                <Icon icon={amenity.icon || 'mdi:check-circle'} className={styles.icon} />
              </div>
              <span className={styles.amenityName}>{amenity.name}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default PropertyAmenities;
