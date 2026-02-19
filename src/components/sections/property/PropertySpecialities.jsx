import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useInView } from 'react-intersection-observer';
import styles from './PropertySpecialities.module.css';

const PropertySpecialities = ({ specialities = [] }) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  if (specialities.length === 0) return null;

  return (
    <section className={styles.section} ref={ref} id="specialities">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
      >
        <h2 className={styles.title}>Property Specialities</h2>

        <div className={styles.grid}>
          {specialities.map((item, idx) => (
            <motion.div
              key={idx}
              className={styles.item}
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              title={item.description || ''}
            >
              <div className={styles.iconWrap}>
                <Icon icon={item.icon || 'mdi:star'} className={styles.icon} />
              </div>
              <span className={styles.name}>{item.name}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default PropertySpecialities;
