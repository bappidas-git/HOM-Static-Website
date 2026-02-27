import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Drawer, IconButton } from '@mui/material';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import { propertyService } from '../../services/api';
import logo from '../../assets/images/logo.png';
import styles from './Header.module.css';

// Static nav items (Buy, Buyer Assistance, Insights, Contact)
const staticNavItems = [
  {
    label: 'Buy',
    path: '/buy',
    children: [
      { label: 'Pre-Launch', path: '/buy/pre-launch' },
      { label: 'Under-construction', path: '/buy/under-construction' },
      { label: 'Ready to Move', path: '/buy/ready-to-move' },
    ],
  },
  {
    label: 'Buyer Assistance',
    path: '/buyer-assistance',
    children: [
      { label: 'Home Loan', path: '/buyer-assistance/home-loan' },
      { label: 'Legal Assistance', path: '/buyer-assistance/legal-assistance' },
      { label: 'Interior Designing', path: '/buyer-assistance/interior-designing' },
    ],
  },
  {
    label: 'Real Estate Insights',
    path: '/insights',
    children: [
      { label: 'Articles', path: '/insights/articles' },
      { label: "FAQ's", path: '/insights/faqs' },
      { label: 'Real Estate Awareness', path: '/insights/real-estate-awareness' },
    ],
  },
  {
    label: 'Contact',
    path: '/contact',
  },
];

// Default rent children (used before API loads)
const defaultRentChildren = [
  { label: 'Apartments', path: '/rent/apartments' },
  { label: 'Villas', path: '/rent/villas' },
];

const sideMenuItems = [
  { label: 'View Properties', path: '/properties', icon: 'mdi:home-city-outline' },
  { label: 'Sign In', path: '/admin/login', icon: 'mdi:login-variant' },
  { label: 'About Us', path: '/about', icon: 'mdi:information-outline' },
  { label: 'Sell/Let Apartment', path: '/sell-let', icon: 'mdi:tag-outline' },
  { label: 'Careers', path: '/careers', icon: 'mdi:briefcase-outline' },
  { label: 'Partnership', path: '/partnership', icon: 'mdi:handshake-outline' },
];

const dropdownVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.15 } },
};

const Header = () => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rentChildren, setRentChildren] = useState(defaultRentChildren);
  const lastScrollY = useRef(0);
  const dropdownTimeoutRef = useRef(null);

  // Fetch dynamic rent categories from API
  useEffect(() => {
    let cancelled = false;
    const fetchRentCategories = async () => {
      try {
        const categories = await propertyService.getCategories('rent');
        if (!cancelled && categories.length > 0) {
          setRentChildren(
            categories.map((cat) => ({
              label: cat.label,
              path: `/rent/${cat.value}`,
            }))
          );
        }
      } catch {
        // Keep default rent children on error
      }
    };
    fetchRentCategories();
    return () => { cancelled = true; };
  }, []);

  // Build full nav items with dynamic rent dropdown
  const navItems = [
    staticNavItems[0], // Buy
    {
      label: 'Rent',
      path: '/rent',
      children: rentChildren,
    },
    ...staticNavItems.slice(1), // Buyer Assistance, Insights, Contact
  ];

  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    setScrolled(currentScrollY > 10);

    if (currentScrollY > 100) {
      setHidden(currentScrollY > lastScrollY.current);
    } else {
      setHidden(false);
    }

    lastScrollY.current = currentScrollY;
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleDropdownEnter = (label) => {
    clearTimeout(dropdownTimeoutRef.current);
    setOpenDropdown(label);
  };

  const handleDropdownLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 150);
  };

  const isActive = (item) => {
    if (item.path === '/contact') return location.pathname === '/contact';
    return location.pathname.startsWith(item.path);
  };

  return (
    <header
      className={`${styles.header} ${scrolled ? styles.scrolled : ''} ${hidden ? styles.hidden : ''}`}
    >
      <div className={styles.headerInner}>
        {/* Logo */}
        <Link to="/" className={styles.logo}>
          <img src={logo} alt="H.O.M Advisory" />
        </Link>

        {/* Navigation */}
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <div
              key={item.label}
              className={styles.navItem}
              onMouseEnter={() => item.children && handleDropdownEnter(item.label)}
              onMouseLeave={() => item.children && handleDropdownLeave()}
            >
              {item.children ? (
                <button
                  className={`${styles.navLink} ${isActive(item) ? styles.active : ''}`}
                  onClick={() =>
                    setOpenDropdown(openDropdown === item.label ? null : item.label)
                  }
                  aria-expanded={openDropdown === item.label}
                  aria-haspopup="true"
                >
                  {item.label}
                  <span
                    className={`${styles.chevron} ${openDropdown === item.label ? styles.open : ''}`}
                  >
                    <Icon icon="mdi:chevron-down" />
                  </span>
                </button>
              ) : (
                <Link
                  to={item.path}
                  className={`${styles.navLink} ${isActive(item) ? styles.active : ''}`}
                >
                  {item.label}
                </Link>
              )}

              {isActive(item) && <div className={styles.activeIndicator} />}

              {/* Dropdown */}
              <AnimatePresence>
                {item.children && openDropdown === item.label && (
                  <motion.div
                    className={styles.dropdown}
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    {item.children.map((child) => (
                      <Link
                        key={child.path}
                        to={child.path}
                        className={styles.dropdownItem}
                        onClick={() => setOpenDropdown(null)}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </nav>

        {/* Hamburger */}
        <button
          className={styles.hamburger}
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
        >
          <div className={styles.hamburgerIcon}>
            <span className={styles.hamburgerLine} />
            <span className={styles.hamburgerLine} />
            <span className={styles.hamburgerLine} />
          </div>
        </button>
      </div>

      {/* Right-side Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ className: styles.drawerPaper }}
      >
        <div className={styles.drawerHeader}>
          <Link to="/" onClick={() => setDrawerOpen(false)}>
            <img src={logo} alt="H.O.M Advisory" />
          </Link>
          <IconButton onClick={() => setDrawerOpen(false)} aria-label="Close menu">
            <Icon icon="mdi:close" width={24} />
          </IconButton>
        </div>
        <div className={styles.drawerList}>
          {sideMenuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={styles.drawerItem}
              onClick={() => setDrawerOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </Drawer>
    </header>
  );
};

export default Header;
