import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import RentCTAForm from './RentCTAForm';
import styles from './RentListingCTA.module.css';

const RentListingCTA = () => {
  const [modalType, setModalType] = useState(null);

  const handleOpen = (type) => setModalType(type);
  const handleClose = () => setModalType(null);

  return (
    <>
      <motion.section
        className={styles.ctaSection}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className={styles.ctaContainer}>
          {/* Tenant Panel */}
          <div className={styles.ctaCard}>
            <div className={styles.cardIconWrap}>
              <Icon icon="mdi:home-search-outline" className={styles.cardIcon} />
            </div>
            <h3 className={styles.cardTitle}>For Tenants</h3>
            <p className={styles.cardText}>
              Can't find the right rental? Let us help you find the perfect place.
            </p>
            <button
              className={styles.ctaBtn}
              onClick={() => handleOpen('tenant')}
              type="button"
            >
              Submit Requirement
              <Icon icon="mdi:arrow-right" />
            </button>
          </div>

          {/* Owner Panel */}
          <div className={styles.ctaCard}>
            <div className={`${styles.cardIconWrap} ${styles.cardIconWrapAlt}`}>
              <Icon icon="mdi:home-plus-outline" className={styles.cardIcon} />
            </div>
            <h3 className={styles.cardTitle}>For Owners</h3>
            <p className={styles.cardText}>
              List your property for rent and reach thousands of verified tenants.
            </p>
            <button
              className={`${styles.ctaBtn} ${styles.ctaBtnAlt}`}
              onClick={() => handleOpen('owner')}
              type="button"
            >
              List Your Property
              <Icon icon="mdi:arrow-right" />
            </button>
          </div>
        </div>
      </motion.section>

      {/* Modal Forms */}
      <RentCTAForm type="tenant" open={modalType === 'tenant'} onClose={handleClose} />
      <RentCTAForm type="owner" open={modalType === 'owner'} onClose={handleClose} />
    </>
  );
};

export default RentListingCTA;
