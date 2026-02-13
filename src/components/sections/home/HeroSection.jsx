import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Icon } from '@iconify/react';
import styles from './HeroSection.module.css';

const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // Subtle parallax on hero background
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 600], [0, 150]);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/properties?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  }, [searchQuery, navigate]);

  return (
    <section className={styles.hero}>
      <motion.div className={styles.bgImage} style={{ y: bgY }} />
      <div className={styles.overlay} />

      <div className={styles.content}>
        <motion.h1
          className={styles.heading}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          Find Your Dream Home
        </motion.h1>

        <motion.p
          className={styles.subtitle}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
        >
          Discover the perfect property from our exclusive collection
        </motion.p>

        <motion.form
          className={styles.searchBar}
          onSubmit={handleSearch}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: 'easeOut' }}
        >
          <div className={styles.searchInputWrapper}>
            <Icon icon="mdi:magnify" className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search address, city, or ZIP"
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search properties"
            />
          </div>
          <button type="submit" className={styles.searchBtn}>
            <Icon icon="mdi:magnify" className={styles.searchBtnIcon} />
            Search
          </button>
        </motion.form>
      </div>
    </section>
  );
};

export default HeroSection;
