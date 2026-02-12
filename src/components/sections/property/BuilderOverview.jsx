import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useInView } from 'react-intersection-observer';
import CountUp from 'react-countup';
import styles from './BuilderOverview.module.css';

const BuilderOverview = ({ developer }) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.15 });

  if (!developer) return null;

  const stats = [
    { value: 20, suffix: '+', label: 'Years Experience', icon: 'mdi:calendar-star' },
    { value: 50, suffix: '+', label: 'Projects Completed', icon: 'mdi:office-building' },
    { value: 97, suffix: '%', label: 'Customer Satisfaction', icon: 'mdi:emoticon-happy' },
    { value: 10, suffix: '+', label: 'Cities Present In', icon: 'mdi:city-variant' },
  ];

  return (
    <section className={styles.section} ref={ref} id="builder">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
      >
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.badge}>
              <Icon icon="mdi:shield-star" /> Meet the Developer
            </span>
            <h2 className={styles.title}>{developer}</h2>
          </div>
          <div className={styles.logoPlaceholder}>
            <Icon icon="mdi:domain" className={styles.logoIcon} />
          </div>
        </div>

        <p className={styles.description}>
          {developer} is one of India's leading real estate developers with decades of experience delivering
          high-quality residential and commercial projects. Known for maintaining high construction standards,
          timely possession, and strong customer focus, {developer} continues to shape India's urban landscape
          with innovation and trust.
        </p>

        <div className={styles.statsGrid}>
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              className={styles.statCard}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.2 + idx * 0.1 }}
            >
              <Icon icon={stat.icon} className={styles.statIcon} />
              <span className={styles.statValue}>
                {inView ? (
                  <CountUp end={stat.value} duration={2} suffix={stat.suffix} />
                ) : (
                  `0${stat.suffix}`
                )}
              </span>
              <span className={styles.statLabel}>{stat.label}</span>
            </motion.div>
          ))}
        </div>

        <div className={styles.qualities}>
          <div className={styles.qualityItem}>
            <Icon icon="mdi:check-decagram" className={styles.qualityIcon} />
            <span>Proven Expertise</span>
          </div>
          <div className={styles.qualityItem}>
            <Icon icon="mdi:clock-check" className={styles.qualityIcon} />
            <span>On-time Delivery</span>
          </div>
          <div className={styles.qualityItem}>
            <Icon icon="mdi:leaf" className={styles.qualityIcon} />
            <span>Sustainable Design</span>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default BuilderOverview;
