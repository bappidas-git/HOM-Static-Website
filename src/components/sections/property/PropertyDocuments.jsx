import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useInView } from 'react-intersection-observer';
import styles from './PropertyDocuments.module.css';

const PropertyDocuments = ({ documents = [] }) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  if (documents.length === 0) return null;

  return (
    <section className={styles.section} ref={ref} id="documents">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
      >
        <h2 className={styles.title}>Property Documents</h2>

        <div className={styles.list}>
          {documents.map((doc, idx) => (
            <motion.div
              key={idx}
              className={styles.docItem}
              initial={{ opacity: 0, x: -10 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.3, delay: idx * 0.08 }}
            >
              <div className={styles.docIcon}>
                <Icon icon={doc.icon || 'mdi:file-document'} />
              </div>
              <span className={styles.docName}>{doc.name}</span>
              <div className={styles.docStatus}>
                <Icon icon="mdi:check-circle" className={styles.checkIcon} />
                <span>Available</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default PropertyDocuments;
