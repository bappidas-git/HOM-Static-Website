import React, { useState } from 'react';
import { newsletterService } from '../../services/api';
import { useToast } from './ToastProvider';
import styles from './NewsletterSection.module.css';

const NewsletterSection = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !email.includes('@')) return;

    setLoading(true);
    try {
      await newsletterService.subscribe(email);
      setEmail('');
      toast.success('Successfully subscribed to our newsletter!');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.newsletter}>
      <div className={styles.inner}>
        <h2 className={styles.heading}>Get latest real estate updates in your inbox</h2>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputWrapper}>
            <input
              type="email"
              placeholder="Email Address*"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              inputMode="email"
              autoComplete="email"
              aria-label="Email address"
            />
          </div>
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? <span className={styles.spinner} /> : 'Subscribe'}
          </button>
        </form>

        <p className={styles.disclaimer}>
          This site is protected by reCAPTCHA and the Google{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
            Privacy Notice
          </a>{' '}
          and{' '}
          <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">
            Terms of Service
          </a>{' '}
          apply.
        </p>
      </div>
    </section>
  );
};

export default NewsletterSection;
