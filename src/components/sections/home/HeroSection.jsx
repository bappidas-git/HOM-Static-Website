import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Icon } from '@iconify/react';
import { siteSettingsService } from '../../../services/api';
import styles from './HeroSection.module.css';

const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.mov'];

/**
 * Detect whether a URL points to a video based on extension or common patterns.
 * This is backend-agnostic — works with any URL structure.
 */
const isVideoUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  try {
    const pathname = new URL(url, window.location.origin).pathname.toLowerCase();
    return VIDEO_EXTENSIONS.some((ext) => pathname.endsWith(ext));
  } catch {
    // Fallback: check raw string for video extensions
    const lower = url.toLowerCase();
    return VIDEO_EXTENSIONS.some((ext) => lower.includes(ext));
  }
};

const FALLBACK_BG = '#1B2A4A';

const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [heroData, setHeroData] = useState(null);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const videoRef = useRef(null);
  const navigate = useNavigate();

  // Subtle parallax on hero background
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 600], [0, 150]);

  useEffect(() => {
    const fetchHeroData = async () => {
      try {
        const settings = await siteSettingsService.get();
        setHeroData(settings?.heroText || null);
      } catch {
        // Silently fail — hero renders with defaults
        setHeroData(null);
      }
    };
    fetchHeroData();
  }, []);

  const handleSearch = useCallback(
    (e) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        navigate(`/properties?q=${encodeURIComponent(searchQuery.trim())}`);
      }
    },
    [searchQuery, navigate]
  );

  // Determine media URL: prefer backgroundMedia, fall back to backgroundImage
  const mediaUrl = heroData?.backgroundMedia || heroData?.backgroundImage || '';
  const isVideo = isVideoUrl(mediaUrl);

  const title = heroData?.title || 'Find Your Dream Home';
  const subtitle =
    heroData?.subtitle ||
    'Discover the perfect property from our exclusive collection';

  const handleMediaLoad = () => setMediaLoaded(true);
  const handleMediaError = () => {
    setMediaError(true);
    setMediaLoaded(true); // Remove loading state even on error
  };

  return (
    <section className={styles.hero}>
      {/* Background Media Layer */}
      {isVideo && mediaUrl && !mediaError ? (
        <motion.div className={styles.bgVideoWrapper} style={{ y: bgY }}>
          <video
            ref={videoRef}
            className={styles.bgVideo}
            src={mediaUrl}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onLoadedData={handleMediaLoad}
            onError={handleMediaError}
          />
        </motion.div>
      ) : (
        <motion.div
          className={styles.bgImage}
          style={{
            y: bgY,
            backgroundImage:
              mediaUrl && !mediaError ? `url(${mediaUrl})` : 'none',
            backgroundColor: !mediaUrl || mediaError ? FALLBACK_BG : undefined,
          }}
        >
          {/* Hidden img for load detection when using image URL */}
          {mediaUrl && !mediaError && !mediaLoaded && (
            <img
              src={mediaUrl}
              alt=""
              style={{ display: 'none' }}
              onLoad={handleMediaLoad}
              onError={handleMediaError}
            />
          )}
        </motion.div>
      )}

      <div className={styles.overlay} />

      <div className={styles.content}>
        <motion.h1
          className={styles.heading}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          {title}
        </motion.h1>

        <motion.p
          className={styles.subtitle}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
        >
          {subtitle}
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
