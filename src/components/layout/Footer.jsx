import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import logo from '../../assets/images/logo.png';
import styles from './Footer.module.css';

const socialLinks = [
  { icon: 'mdi:instagram', label: 'Instagram', href: '#' },
  { icon: 'mdi:facebook', label: 'Facebook', href: '#' },
  { icon: 'mdi:twitter', label: 'Twitter', href: '#' },
  { icon: 'mdi:linkedin', label: 'LinkedIn', href: '#' },
];

const footerColumns = [
  {
    title: 'Homes',
    links: [
      { label: 'Buy', path: '/buy/ready-to-move' },
      { label: 'Rent', path: '/rent/apartments' },
      { label: 'Sell/Let', path: '/sell-let' },
    ],
  },
  {
    title: 'Offices',
    links: [
      { label: 'Flexible Workspace', path: '/properties' },
      { label: 'Direct Lease', path: '/properties' },
      { label: 'Retails', path: '/properties' },
    ],
  },
  {
    title: 'Market',
    links: [
      { label: 'Home Loans', path: '/buyer-assistance/home-loan' },
      { label: 'Legal', path: '/buyer-assistance/legal-assistance' },
      { label: 'Home Interiors', path: '/buyer-assistance/interior-designing' },
    ],
  },
];

// Placeholder images for the collage
const collageImages = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=300&fit=crop',
];

const Footer = () => {
  return (
    <footer className={styles.footer}>
      {/* Top Section */}
      <div className={styles.footerTop}>
        {/* Brand */}
        <div className={styles.brandSection}>
          <img src={logo} alt="H.O.M Advisory" className={styles.brandLogo} />
          <div className={styles.brandSubtitle}>HOME OFFICE MARKET</div>
          <p className={styles.brandTagline}>
            Your connection to the finest homes and experiences no matter the destination or lifestyle.
          </p>
          <div className={styles.brandElevating}>
            ELEVATING EVERY EXPERIENCE IN REAL ESTATE
          </div>
          <div className={styles.socialIcons}>
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                className={styles.socialIcon}
                aria-label={social.label}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon icon={social.icon} />
              </a>
            ))}
          </div>
        </div>

        {/* Image Collage */}
        <div className={styles.imageCollage}>
          {collageImages.map((src, index) => (
            <img
              key={index}
              src={src}
              alt={`Property ${index + 1}`}
              className={styles.collageImage}
              loading="lazy"
            />
          ))}
        </div>
      </div>

      {/* Bottom Columns */}
      <div className={styles.footerBottom}>
        {footerColumns.map((column) => (
          <div key={column.title} className={styles.footerColumn}>
            <h4>{column.title}</h4>
            {column.links.map((link) => (
              <Link key={link.label} to={link.path} className={styles.footerLink}>
                {link.label}
              </Link>
            ))}
          </div>
        ))}

        {/* Contact Column */}
        <div className={styles.footerColumn}>
          <h4>Contact</h4>
          <div className={styles.contactItem}>
            <span className={styles.contactIcon}>
              <Icon icon="mdi:phone" />
            </span>
            <a href="tel:+15551234567">(555) 123-4567</a>
          </div>
          <div className={styles.contactItem}>
            <span className={styles.contactIcon}>
              <Icon icon="mdi:email-outline" />
            </span>
            <a href="mailto:info@homadvisory.com">info@homadvisory.com</a>
          </div>
          <div className={styles.contactItem}>
            <span className={styles.contactIcon}>
              <Icon icon="mdi:map-marker-outline" />
            </span>
            <span>123 Luxury Ave, Suite 100</span>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className={styles.copyright}>
        &copy; 2026 H.O.M Advisory. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
