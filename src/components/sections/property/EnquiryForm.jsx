import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { leadService } from '../../../services/api';
import styles from './EnquiryForm.module.css';

const EnquiryForm = ({ property, isMobile = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: property ? `I'm interested in ${property.title}` : '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.phone) {
      setError('Name and phone are required');
      return;
    }

    try {
      setSubmitting(true);
      await leadService.create({
        ...formData,
        propertyId: property?.id || null,
        source: 'property_enquiry',
      });
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formContent = submitted ? (
    <div className={styles.success}>
      <Icon icon="mdi:check-circle" className={styles.successIcon} />
      <h3 className={styles.successTitle}>Thank You!</h3>
      <p className={styles.successText}>
        Our team will contact you shortly about {property?.title || 'this property'}.
      </p>
    </div>
  ) : (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h3 className={styles.formTitle}>
        <Icon icon="mdi:account-box" className={styles.formTitleIcon} />
        Contact Agent
      </h3>

      <div className={styles.field}>
        <input
          type="text"
          name="name"
          placeholder="Your Name *"
          value={formData.name}
          onChange={handleChange}
          className={styles.input}
          required
        />
      </div>

      <div className={styles.field}>
        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={handleChange}
          className={styles.input}
        />
      </div>

      <div className={styles.field}>
        <input
          type="tel"
          name="phone"
          placeholder="Phone Number *"
          value={formData.phone}
          onChange={handleChange}
          className={styles.input}
          required
        />
      </div>

      <div className={styles.field}>
        <textarea
          name="message"
          placeholder="Your message..."
          value={formData.message}
          onChange={handleChange}
          className={styles.textarea}
          rows={3}
        />
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <button type="submit" className={styles.submitBtn} disabled={submitting}>
        {submitting ? 'Sending...' : 'Send Enquiry'}
        {!submitting && <Icon icon="mdi:send" />}
      </button>
    </form>
  );

  // Mobile: Fixed bottom button + bottom sheet
  if (isMobile) {
    return (
      <>
        <button
          className={styles.mobileFixedBtn}
          onClick={() => setMobileOpen(true)}
        >
          <Icon icon="mdi:message-text" />
          Enquire Now
        </button>

        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                className={styles.backdrop}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
              />
              <motion.div
                className={styles.bottomSheet}
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              >
                <div className={styles.sheetHandle} />
                <button
                  className={styles.sheetClose}
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close"
                >
                  <Icon icon="mdi:close" />
                </button>
                {formContent}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Desktop: Sticky sidebar
  return (
    <div className={styles.sidebar}>
      {formContent}
    </div>
  );
};

export default EnquiryForm;
