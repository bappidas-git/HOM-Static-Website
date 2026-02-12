import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useInView } from 'react-intersection-observer';
import { faqService } from '../../../services/api';
import styles from './FaqSection.module.css';

const FaqItem = ({ faq, isOpen, onToggle }) => {
  return (
    <div className={`${styles.faqItem} ${isOpen ? styles.faqItemActive : ''}`}>
      <button className={styles.faqQuestion} onClick={onToggle} aria-expanded={isOpen}>
        <div className={styles.faqLeft}>
          <Icon icon="mdi:help-circle-outline" className={styles.questionIcon} />
          <span>{faq.question}</span>
        </div>
        <Icon
          icon={isOpen ? 'mdi:minus' : 'mdi:plus'}
          className={styles.expandIcon}
        />
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
};

const FaqSection = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.15 });

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const data = await faqService.getAll({ _limit: 4 });
        setFaqs(data);
      } catch {
        setFaqs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFaqs();
  }, []);

  const handleToggle = (id) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  if (loading) return null;
  if (!faqs.length) return null;

  return (
    <section className={styles.section} ref={ref}>
      <div className={styles.container}>
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <h2 className={styles.title}>Frequently Asked Questions</h2>
          <p className={styles.subtitle}>
            Get answers to common questions about buying and selling properties
          </p>
        </motion.div>

        <motion.div
          className={styles.faqList}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {faqs.map((faq) => (
            <FaqItem
              key={faq.id}
              faq={faq}
              isOpen={openId === faq.id}
              onToggle={() => handleToggle(faq.id)}
            />
          ))}
        </motion.div>

        <div className={styles.cta}>
          <Link to="/insights/faqs" className={styles.ctaLink}>
            View All FAQs
            <Icon icon="mdi:arrow-right" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
