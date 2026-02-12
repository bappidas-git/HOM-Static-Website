import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useInView } from 'react-intersection-observer';
import styles from './PropertySpecs.module.css';

const PropertySpecs = ({ specifications = {}, propertyType }) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  };

  const specs = [
    { icon: 'mdi:land-plots', label: 'Project Area', value: specifications.projectArea || '—' },
    { icon: 'mdi:office-building', label: specifications.towers ? 'Towers' : 'Type', value: specifications.towers ? `${specifications.towers} Towers` : propertyType || '—' },
    { icon: 'mdi:home-group', label: 'Total Units', value: specifications.totalUnits ? `${specifications.totalUnits}+ ${propertyType === 'villa' ? 'Villas' : 'Apartments'}` : '—' },
    { icon: 'mdi:stairs', label: 'Floors', value: specifications.floors ? `Upto ${specifications.floors} Floors` : '—' },
    { icon: 'mdi:floor-plan', label: 'Unit Variants', value: specifications.constructionType || '—' },
    { icon: 'mdi:file-certificate', label: 'RERA ID', value: specifications.reraId || '—' },
    { icon: 'mdi:rocket-launch', label: 'Launch Date', value: formatDate(specifications.launchDate) },
    { icon: 'mdi:key-variant', label: 'Possession Date', value: formatDate(specifications.possessionDate) },
  ].filter((s) => s.value !== '—');

  if (specs.length === 0) return null;

  return (
    <section className={styles.section} ref={ref} id="specifications">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
      >
        <h2 className={styles.title}>Property Specifications</h2>

        <div className={styles.grid}>
          {specs.map((spec, idx) => (
            <motion.div
              key={idx}
              className={styles.specItem}
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
            >
              <div className={styles.iconWrap}>
                <Icon icon={spec.icon} className={styles.icon} />
              </div>
              <div className={styles.specInfo}>
                <span className={styles.specLabel}>{spec.label}</span>
                <span className={styles.specValue}>{spec.value}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default PropertySpecs;
