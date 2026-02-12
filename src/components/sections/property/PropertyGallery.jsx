import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import styles from './PropertyGallery.module.css';

const PropertyGallery = ({ images = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [direction, setDirection] = useState(0);

  const gallery = images.length
    ? images
    : ['https://placehold.co/800x600/1B2A4A/white?text=No+Image'];

  const goTo = useCallback((index) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  }, [currentIndex]);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev === 0 ? gallery.length - 1 : prev - 1));
  }, [gallery.length]);

  const goNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev === gallery.length - 1 ? 0 : prev + 1));
  }, [gallery.length]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') setLightboxOpen(false);
    if (e.key === 'ArrowLeft') goPrev();
    if (e.key === 'ArrowRight') goNext();
  }, [goPrev, goNext]);

  const slideVariants = {
    enter: (dir) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
  };

  return (
    <>
      <div className={styles.gallery}>
        <div className={styles.mainImage} onClick={() => setLightboxOpen(true)}>
          <AnimatePresence custom={direction} mode="wait">
            <motion.img
              key={currentIndex}
              src={gallery[currentIndex]}
              alt={`Property view ${currentIndex + 1}`}
              className={styles.image}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            />
          </AnimatePresence>

          <div className={styles.counter}>
            {currentIndex + 1} / {gallery.length}
          </div>

          <button className={styles.expandBtn} aria-label="View fullscreen">
            <Icon icon="mdi:fullscreen" />
          </button>

          {gallery.length > 1 && (
            <>
              <button
                className={`${styles.navBtn} ${styles.navPrev}`}
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                aria-label="Previous image"
              >
                <Icon icon="mdi:chevron-left" />
              </button>
              <button
                className={`${styles.navBtn} ${styles.navNext}`}
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                aria-label="Next image"
              >
                <Icon icon="mdi:chevron-right" />
              </button>
            </>
          )}
        </div>

        {gallery.length > 1 && (
          <div className={styles.thumbnails}>
            {gallery.map((img, idx) => (
              <button
                key={idx}
                className={`${styles.thumb} ${idx === currentIndex ? styles.thumbActive : ''}`}
                onClick={() => goTo(idx)}
                aria-label={`View image ${idx + 1}`}
              >
                <img src={img} alt={`Thumbnail ${idx + 1}`} loading="lazy" />
              </button>
            ))}
          </div>
        )}

        {/* Mobile dots */}
        {gallery.length > 1 && (
          <div className={styles.dots}>
            {gallery.map((_, idx) => (
              <span
                key={idx}
                className={`${styles.dot} ${idx === currentIndex ? styles.dotActive : ''}`}
                onClick={() => goTo(idx)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            className={styles.lightbox}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxOpen(false)}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="dialog"
            aria-label="Image gallery"
          >
            <button
              className={styles.lightboxClose}
              onClick={() => setLightboxOpen(false)}
              aria-label="Close gallery"
            >
              <Icon icon="mdi:close" />
            </button>

            <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
              <AnimatePresence custom={direction} mode="wait">
                <motion.img
                  key={currentIndex}
                  src={gallery[currentIndex]}
                  alt={`Property view ${currentIndex + 1}`}
                  className={styles.lightboxImage}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                />
              </AnimatePresence>

              <div className={styles.lightboxCounter}>
                {currentIndex + 1} / {gallery.length}
              </div>

              {gallery.length > 1 && (
                <>
                  <button
                    className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
                    onClick={goPrev}
                    aria-label="Previous"
                  >
                    <Icon icon="mdi:chevron-left" />
                  </button>
                  <button
                    className={`${styles.lightboxNav} ${styles.lightboxNext}`}
                    onClick={goNext}
                    aria-label="Next"
                  >
                    <Icon icon="mdi:chevron-right" />
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PropertyGallery;
