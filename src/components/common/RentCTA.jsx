import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import LeadForm from './LeadForm';
import styles from './RentCTA.module.css';

const RentCTA = () => {
  const [activePopup, setActivePopup] = useState(null);

  const closePopup = () => setActivePopup(null);

  const tenantFields = [
    { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Your Name *' },
    { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'Email Address *' },
    { name: 'phone', label: 'Phone', type: 'tel', required: true, placeholder: 'Phone Number *' },
    { name: 'message', label: 'Requirements', type: 'textarea', required: false, placeholder: 'Describe your rental requirements (area, budget, etc.)' },
  ];

  const ownerFields = [
    { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Your Name *' },
    { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'Email Address *' },
    { name: 'phone', label: 'Phone', type: 'tel', required: true, placeholder: 'Phone Number *' },
    { name: 'message', label: 'Property Details', type: 'textarea', required: false, placeholder: 'Describe your property (type, location, rent expected, etc.)' },
  ];

  return (
    <>
      <div className={styles.ctaContainer}>
        <div className={styles.ctaCard}>
          <div className={styles.ctaIconWrap}>
            <Icon icon="mdi:home-search-outline" className={styles.ctaIcon} />
          </div>
          <div className={styles.ctaContent}>
            <h3 className={styles.ctaTitle}>For Tenants</h3>
            <p className={styles.ctaText}>Can't find the right rental? Let us help you find the perfect place.</p>
          </div>
          <button
            className={styles.ctaButton}
            onClick={() => setActivePopup('tenant')}
          >
            Submit Requirement
            <Icon icon="mdi:arrow-right" />
          </button>
        </div>

        <div className={styles.ctaDivider} />

        <div className={styles.ctaCard}>
          <div className={styles.ctaIconWrap}>
            <Icon icon="mdi:home-plus-outline" className={styles.ctaIcon} />
          </div>
          <div className={styles.ctaContent}>
            <h3 className={styles.ctaTitle}>For Owners</h3>
            <p className={styles.ctaText}>List your property for rent and reach thousands of verified tenants.</p>
          </div>
          <button
            className={`${styles.ctaButton} ${styles.ctaButtonSecondary}`}
            onClick={() => setActivePopup('owner')}
          >
            List Your Property
            <Icon icon="mdi:arrow-right" />
          </button>
        </div>
      </div>

      {/* Popup Lead Forms */}
      <AnimatePresence>
        {activePopup && (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePopup}
          >
            <motion.div
              className={styles.popup}
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 350, damping: 30 } }}
              exit={{ opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.2 } }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className={styles.closeBtn} onClick={closePopup} aria-label="Close">
                <Icon icon="mdi:close" />
              </button>
              <LeadForm
                title={activePopup === 'tenant' ? 'Find Your Perfect Rental' : 'List Your Property for Rent'}
                subtitle={activePopup === 'tenant'
                  ? 'Tell us your requirements and our team will find the best options for you.'
                  : 'Share your property details and start getting tenant enquiries.'}
                fields={activePopup === 'tenant' ? tenantFields : ownerFields}
                source={activePopup === 'tenant' ? 'rent_requirement' : 'rent_listing_request'}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default RentCTA;
