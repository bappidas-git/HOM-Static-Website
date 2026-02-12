import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useInView } from 'react-intersection-observer';
import styles from './PropertyFaq.module.css';

const defaultFaqs = (property) => [
  {
    question: `What is the possession date for ${property.title}?`,
    answer: `The expected possession date for ${property.title} is ${property.possession}. Please contact us for the most updated timeline.`,
  },
  {
    question: `What configurations are available at ${property.title}?`,
    answer: `${property.title} offers ${property.configuration?.join(', ')} configurations with areas ranging from ${property.dimensionRange?.min} to ${property.dimensionRange?.max} ${property.dimensionRange?.unit}.`,
  },
  {
    question: `Is ${property.title} RERA registered?`,
    answer: `Yes, ${property.title} is a RERA registered project. The RERA ID is ${property.specifications?.reraId || 'available on request'}. You can verify this on the official RERA website.`,
  },
  {
    question: `What is the starting price of ${property.title}?`,
    answer: `The starting price for ${property.title} is ₹${(property.price / (property.price >= 10000000 ? 10000000 : 100000)).toFixed(2)} ${property.price >= 10000000 ? 'Cr' : 'L'} ${property.priceUnit}. Prices vary based on configuration and floor.`,
  },
  {
    question: `Who is the developer of ${property.title}?`,
    answer: `${property.title} is developed by ${property.developer}, a trusted name in real estate with a proven track record of delivering quality projects.`,
  },
];

const FaqItem = ({ faq, isOpen, onToggle, index }) => (
  <div className={`${styles.faqItem} ${isOpen ? styles.faqItemActive : ''}`}>
    <button className={styles.faqQuestion} onClick={onToggle} aria-expanded={isOpen}>
      <span className={styles.questionText}>{faq.question}</span>
      <Icon icon={isOpen ? 'mdi:minus' : 'mdi:plus'} className={styles.expandIcon} />
    </button>
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          className={styles.faqAnswer}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          <div className={styles.answerInner}>{faq.answer}</div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const PropertyFaq = ({ property }) => {
  const [openIdx, setOpenIdx] = useState(null);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  if (!property) return null;

  const faqs = defaultFaqs(property);

  return (
    <section className={styles.section} ref={ref} id="faqs">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
      >
        <h2 className={styles.title}>FAQs About This Project</h2>

        <div className={styles.faqList}>
          {faqs.map((faq, idx) => (
            <FaqItem
              key={idx}
              faq={faq}
              index={idx}
              isOpen={openIdx === idx}
              onToggle={() => setOpenIdx((prev) => (prev === idx ? null : idx))}
            />
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default PropertyFaq;
