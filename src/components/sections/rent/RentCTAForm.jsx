import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { leadService } from '../../../services/api';
import { useToast } from '../../common/ToastProvider';
import {
  getNameErrorMessage,
  getEmailErrorMessage,
  getMobileErrorMessage,
  sanitizeInput,
} from '../../../utils/validators';
import styles from './RentCTAForm.module.css';

const TENANT_FIELDS = [
  { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Full Name *' },
  { name: 'email', label: 'Email', type: 'email', required: false, placeholder: 'Email Address' },
  { name: 'phone', label: 'Phone', type: 'tel', required: true, placeholder: 'Phone Number *' },
  { name: 'preferredLocation', label: 'Preferred Location', type: 'text', required: false, placeholder: 'Preferred Location' },
  { name: 'budgetRange', label: 'Budget Range', type: 'text', required: false, placeholder: 'Budget Range (e.g. ₹15,000 - ₹25,000)' },
  {
    name: 'configuration',
    label: 'Configuration',
    type: 'select',
    required: false,
    placeholder: 'Select Configuration',
    options: [
      { value: '1 BHK', label: '1 BHK' },
      { value: '2 BHK', label: '2 BHK' },
      { value: '3 BHK', label: '3 BHK' },
      { value: '4 BHK', label: '4 BHK' },
      { value: '4+ BHK', label: '4+ BHK' },
      { value: 'Studio', label: 'Studio' },
    ],
  },
];

const OWNER_FIELDS = [
  { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Full Name *' },
  { name: 'email', label: 'Email', type: 'email', required: false, placeholder: 'Email Address' },
  { name: 'phone', label: 'Phone', type: 'tel', required: true, placeholder: 'Phone Number *' },
  { name: 'propertyLocation', label: 'Property Location', type: 'text', required: false, placeholder: 'Property Location' },
  {
    name: 'propertyType',
    label: 'Property Type',
    type: 'select',
    required: false,
    placeholder: 'Select Property Type',
    options: [
      { value: 'Apartment', label: 'Apartment' },
      { value: 'Villa', label: 'Villa' },
      { value: 'Studio', label: 'Studio' },
      { value: 'Penthouse', label: 'Penthouse' },
      { value: 'Independent House', label: 'Independent House' },
      { value: 'Row House', label: 'Row House' },
    ],
  },
  { name: 'expectedRent', label: 'Expected Rent', type: 'text', required: false, placeholder: 'Expected Rent (e.g. ₹25,000/month)' },
];

const FORM_CONFIG = {
  tenant: {
    title: 'Submit Your Rental Requirement',
    subtitle: 'Tell us what you\'re looking for and we\'ll help you find it.',
    fields: TENANT_FIELDS,
    message: 'Rental Requirement Submission',
    source: 'rent_listing_cta_tenant',
    successMessage: 'Requirement submitted! Our team will help you find the perfect rental.',
    additionalKeys: ['preferredLocation', 'budgetRange', 'configuration'],
  },
  owner: {
    title: 'List Your Property for Rent',
    subtitle: 'Provide your property details and reach thousands of verified tenants.',
    fields: OWNER_FIELDS,
    message: 'Owner Rent Listing Inquiry',
    source: 'rent_listing_cta_owner',
    successMessage: 'Listing inquiry submitted! Our team will get in touch shortly.',
    additionalKeys: ['propertyLocation', 'propertyType', 'expectedRent'],
  },
};

const RentCTAForm = ({ type = 'tenant', open, onClose }) => {
  const formConfig = FORM_CONFIG[type];
  const toast = useToast();

  const buildInitialValues = () => {
    const values = {};
    formConfig.fields.forEach((f) => {
      values[f.name] = '';
    });
    return values;
  };

  const [formData, setFormData] = useState(buildInitialValues);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validateField = (field, value) => {
    if (field.name === 'name') return getNameErrorMessage(value);
    if (field.type === 'email') return getEmailErrorMessage(value, field.required);
    if (field.type === 'tel') return getMobileErrorMessage(value);
    if (field.required && !sanitizeInput(value)) return `${field.label} is required`;
    return '';
  };

  const validate = () => {
    const newErrors = {};
    let valid = true;
    formConfig.fields.forEach((field) => {
      const err = validateField(field, formData[field.name] || '');
      if (err) {
        newErrors[field.name] = err;
        valid = false;
      }
    });
    setErrors(newErrors);
    return valid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const resetForm = () => {
    setFormData(buildInitialValues());
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);

      const additionalDetails = {};
      formConfig.additionalKeys.forEach((key) => {
        if (formData[key]) {
          additionalDetails[key] = sanitizeInput(formData[key]);
        }
      });

      await leadService.create({
        name: sanitizeInput(formData.name),
        email: sanitizeInput(formData.email),
        phone: sanitizeInput(formData.phone),
        message: formConfig.message,
        source: formConfig.source,
        propertyId: null,
        additionalDetails,
      });

      toast.success(formConfig.successMessage);
      handleClose();
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <button
              className={styles.closeBtn}
              onClick={handleClose}
              aria-label="Close"
              type="button"
            >
              <Icon icon="mdi:close" />
            </button>

            <h3 className={styles.formTitle}>{formConfig.title}</h3>
            <p className={styles.formSubtitle}>{formConfig.subtitle}</p>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.fields}>
                {formConfig.fields.map((field) => (
                  <div key={field.name} className={styles.field}>
                    {field.type === 'select' ? (
                      <select
                        name={field.name}
                        value={formData[field.name] || ''}
                        onChange={handleChange}
                        className={`${styles.select} ${errors[field.name] ? styles.inputError : ''}`}
                      >
                        <option value="">{field.placeholder || `Select ${field.label}`}</option>
                        {(field.options || []).map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type || 'text'}
                        name={field.name}
                        placeholder={field.placeholder || field.label}
                        value={formData[field.name] || ''}
                        onChange={handleChange}
                        inputMode={field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : undefined}
                        autoComplete={field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : field.name === 'name' ? 'name' : undefined}
                        className={`${styles.input} ${errors[field.name] ? styles.inputError : ''}`}
                      />
                    )}
                    {errors[field.name] && (
                      <span className={styles.errorText}>{errors[field.name]}</span>
                    )}
                  </div>
                ))}
              </div>

              <button type="submit" className={styles.submitBtn} disabled={submitting}>
                {submitting ? (
                  <span className={styles.spinner} />
                ) : (
                  <>
                    Submit
                    <Icon icon="mdi:arrow-right" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default RentCTAForm;
