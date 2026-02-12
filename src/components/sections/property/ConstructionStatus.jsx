import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useInView } from 'react-intersection-observer';
import styles from './ConstructionStatus.module.css';

const milestones = [
  { key: 'foundation', label: 'Foundation', icon: 'mdi:shovel' },
  { key: 'structure', label: 'Structure', icon: 'mdi:crane' },
  { key: 'finishing', label: 'Finishing', icon: 'mdi:format-paint' },
  { key: 'handover', label: 'Handover', icon: 'mdi:key-variant' },
];

const ConstructionStatus = ({ status }) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  // Determine current milestone based on property status
  const getProgress = () => {
    if (status === 'ready-to-move') return 4;
    if (status === 'under-construction') return 2;
    if (status === 'pre-launch') return 0;
    return 0;
  };

  const progress = getProgress();

  const getStatusLabel = () => {
    if (status === 'ready-to-move') return 'Completed — Ready to Move';
    if (status === 'under-construction') return 'Under Construction';
    if (status === 'pre-launch') return 'Pre-Launch — Coming Soon';
    return status;
  };

  return (
    <section className={styles.section} ref={ref} id="construction">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
      >
        <h2 className={styles.title}>Construction Status</h2>

        <div className={styles.statusBadge}>
          <Icon
            icon={status === 'ready-to-move' ? 'mdi:check-circle' : 'mdi:progress-clock'}
            className={styles.statusIcon}
          />
          <span>{getStatusLabel()}</span>
        </div>

        <div className={styles.timeline}>
          <div className={styles.progressBar}>
            <motion.div
              className={styles.progressFill}
              initial={{ width: 0 }}
              animate={inView ? { width: `${(progress / milestones.length) * 100}%` } : {}}
              transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
            />
          </div>

          <div className={styles.milestones}>
            {milestones.map((milestone, idx) => {
              const isCompleted = idx < progress;
              const isCurrent = idx === progress;
              return (
                <div
                  key={milestone.key}
                  className={`${styles.milestone} ${isCompleted ? styles.completed : ''} ${isCurrent ? styles.current : ''}`}
                >
                  <div className={styles.milestoneIcon}>
                    {isCompleted ? (
                      <Icon icon="mdi:check" />
                    ) : (
                      <Icon icon={milestone.icon} />
                    )}
                  </div>
                  <span className={styles.milestoneLabel}>{milestone.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default ConstructionStatus;
