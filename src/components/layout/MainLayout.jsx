import React from 'react';
import { useLocation } from 'react-router-dom';
import { useMediaQuery, useTheme } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './Header';
import MobileHeader from './MobileHeader';
import Footer from './Footer';
import BottomNav from './BottomNav';
import NewsletterSection from '../common/NewsletterSection';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2 } },
};

const MainLayout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // below 960px
  const location = useLocation();

  return (
    <>
      {/* Header */}
      {isMobile ? <MobileHeader /> : <Header />}

      {/* Main Content */}
      <main
        style={{
          paddingTop: isMobile ? 60 : 72,
          paddingBottom: isMobile ? 56 : 0,
          minHeight: '100vh',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Newsletter + Footer */}
      <NewsletterSection />
      <Footer />

      {/* Mobile Bottom Nav */}
      {isMobile && <BottomNav />}
    </>
  );
};

export default MainLayout;
