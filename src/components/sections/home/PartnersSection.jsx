import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { partnerService } from '../../../services/api';
import styles from './PartnersSection.module.css';

const PartnersSection = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.15 });

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const data = await partnerService.getActive();
        setPartners(data);
      } catch {
        setPartners([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPartners();
  }, []);

  // Auto-scroll marquee effect
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || partners.length === 0) return;

    let animationId;
    let scrollPos = 0;

    const scroll = () => {
      scrollPos += 0.5;
      if (scrollPos >= el.scrollWidth / 2) {
        scrollPos = 0;
      }
      el.scrollLeft = scrollPos;
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);

    const handleHover = () => cancelAnimationFrame(animationId);
    const handleLeave = () => {
      animationId = requestAnimationFrame(scroll);
    };

    el.addEventListener('mouseenter', handleHover);
    el.addEventListener('mouseleave', handleLeave);

    return () => {
      cancelAnimationFrame(animationId);
      el.removeEventListener('mouseenter', handleHover);
      el.removeEventListener('mouseleave', handleLeave);
    };
  }, [partners]);

  if (loading) return null;
  if (!partners.length) return null;

  // Duplicate for seamless marquee
  const displayPartners = [...partners, ...partners];

  return (
    <section className={styles.section} ref={ref}>
      <div className={styles.container}>
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <h2 className={styles.title}>Our Partners</h2>
          <p className={styles.subtitle}>Trusted developers we work with</p>
        </motion.div>

        <motion.div
          className={styles.marqueeWrapper}
          ref={scrollRef}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className={styles.marqueeTrack}>
            {displayPartners.map((partner, idx) => {
              const content = (
                <>
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className={styles.partnerLogo}
                    loading="lazy"
                  />
                  <span className={styles.partnerName}>{partner.name}</span>
                </>
              );

              return partner.website ? (
                <a
                  key={`${partner.id}-${idx}`}
                  href={partner.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.partnerCard}
                >
                  {content}
                </a>
              ) : (
                <div
                  key={`${partner.id}-${idx}`}
                  className={styles.partnerCard}
                >
                  {content}
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PartnersSection;
