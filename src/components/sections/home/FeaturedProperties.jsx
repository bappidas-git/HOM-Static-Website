import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import Slider from 'react-slick';
import { Icon } from '@iconify/react';
import { propertyService } from '../../../services/api';
import PropertyCard from '../../common/PropertyCard';
import styles from './FeaturedProperties.module.css';

import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const PrevArrow = ({ onClick }) => (
  <button className={`${styles.slickArrow} ${styles.slickPrev}`} onClick={onClick} aria-label="Previous">
    <Icon icon="mdi:chevron-left" />
  </button>
);

const NextArrow = ({ onClick }) => (
  <button className={`${styles.slickArrow} ${styles.slickNext}`} onClick={onClick} aria-label="Next">
    <Icon icon="mdi:chevron-right" />
  </button>
);

const FeaturedProperties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const data = await propertyService.getFeatured();
        setProperties(data);
      } catch {
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  const settings = {
    dots: true,
    infinite: properties.length > 3,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    prevArrow: <PrevArrow />,
    nextArrow: <NextArrow />,
    responsive: [
      {
        breakpoint: 960,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          arrows: false,
        },
      },
    ],
  };

  return (
    <section className={styles.section} ref={ref}>
      <div className={styles.container}>
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <h2 className={styles.title}>Featured Properties</h2>
          <p className={styles.subtitle}>
            Explore our handpicked selection of premium properties
          </p>
        </motion.div>

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
          </div>
        ) : properties.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Slider {...settings} className={styles.slider}>
              {properties.map((property) => (
                <div key={property.id} className={styles.slideItem}>
                  <PropertyCard property={property} />
                </div>
              ))}
            </Slider>
          </motion.div>
        ) : (
          <p className={styles.empty}>No featured properties available.</p>
        )}

        <div className={styles.cta}>
          <Link to="/properties" className={styles.ctaBtn}>
            View All Properties
            <Icon icon="mdi:arrow-right" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProperties;
