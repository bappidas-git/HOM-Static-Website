import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useInView } from 'react-intersection-observer';
import styles from './FinanceGuide.module.css';

const formatCurrency = (val) => {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
  return `₹${Math.round(val).toLocaleString('en-IN')}`;
};

const FinanceGuide = ({ price = 0 }) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const [loanPercent, setLoanPercent] = useState(80);
  const [interestRate, setInterestRate] = useState(8.5);
  const [tenure, setTenure] = useState(20);

  const loanAmount = (price * loanPercent) / 100;

  const emi = useMemo(() => {
    const r = interestRate / 12 / 100;
    const n = tenure * 12;
    if (r === 0) return loanAmount / n;
    return (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }, [loanAmount, interestRate, tenure]);

  const totalAmount = emi * tenure * 12;
  const totalInterest = totalAmount - loanAmount;

  const banks = [
    { name: 'HDFC Bank', icon: 'mdi:bank' },
    { name: 'SBI Bank', icon: 'mdi:bank' },
    { name: 'Axis Bank', icon: 'mdi:bank' },
    { name: 'ICICI Bank', icon: 'mdi:bank' },
    { name: 'Kotak Mahindra', icon: 'mdi:bank' },
    { name: 'LIC Housing Finance', icon: 'mdi:bank' },
  ];

  const highlights = [
    { icon: 'mdi:percent-circle', title: 'Lowest Interest Rates', desc: 'Starting 8.35% p.a.' },
    { icon: 'mdi:clock-fast', title: 'Quick Approval', desc: 'Within 48 hours' },
    { icon: 'mdi:file-document-check', title: 'Minimal Documentation', desc: 'Hassle-free process' },
    { icon: 'mdi:cash-multiple', title: 'Up to 90% Financing', desc: 'Maximum loan coverage' },
  ];

  if (!price) return null;

  return (
    <section className={styles.section} ref={ref} id="finance">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
      >
        <h2 className={styles.title}>Home Finance Clarity</h2>

        {/* ─── Bank Approval Info Section ─── */}
        <div className={styles.financeInfo}>
          <div className={styles.financeInfoHeader}>
            <div className={styles.financeInfoIconWrap}>
              <Icon icon="mdi:shield-check" className={styles.financeInfoIcon} />
            </div>
            <div className={styles.financeInfoText}>
              <h3 className={styles.financeInfoTitle}>Pre-Approved by Leading Banks</h3>
              <p className={styles.financeInfoDesc}>
                This property is pre-approved for home loans from India's top banks, ensuring a seamless financing experience for your dream home.
              </p>
            </div>
          </div>

          <div className={styles.highlightsGrid}>
            {highlights.map((item, idx) => (
              <motion.div
                key={idx}
                className={styles.highlightCard}
                initial={{ opacity: 0, y: 12 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.3, delay: 0.1 + idx * 0.08 }}
              >
                <Icon icon={item.icon} className={styles.highlightIcon} />
                <span className={styles.highlightTitle}>{item.title}</span>
                <span className={styles.highlightDesc}>{item.desc}</span>
              </motion.div>
            ))}
          </div>

          <div className={styles.approvedBanks}>
            <span className={styles.approvedBanksLabel}>Approved Banks</span>
            <div className={styles.approvedBanksList}>
              {banks.map((bank, idx) => (
                <div key={idx} className={styles.approvedBankChip}>
                  <Icon icon={bank.icon} className={styles.approvedBankIcon} />
                  <span>{bank.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── EMI Calculator ─── */}
        <h3 className={styles.calcTitle}>
          <Icon icon="mdi:calculator-variant" className={styles.calcTitleIcon} />
          EMI Calculator
        </h3>

        <div className={styles.grid}>
          <div className={styles.calculator}>
            <div className={styles.priceDisplay}>
              <span className={styles.priceLabel}>Property Price</span>
              <span className={styles.priceValue}>{formatCurrency(price)}</span>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>
                Loan Amount ({loanPercent}%)
                <span className={styles.inputValue}>{formatCurrency(loanAmount)}</span>
              </label>
              <input
                type="range"
                min="50"
                max="90"
                value={loanPercent}
                onChange={(e) => setLoanPercent(Number(e.target.value))}
                className={styles.range}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>
                Interest Rate
                <span className={styles.inputValue}>{interestRate}% p.a.</span>
              </label>
              <input
                type="range"
                min="6"
                max="14"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className={styles.range}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>
                Loan Tenure
                <span className={styles.inputValue}>{tenure} years</span>
              </label>
              <input
                type="range"
                min="5"
                max="30"
                value={tenure}
                onChange={(e) => setTenure(Number(e.target.value))}
                className={styles.range}
              />
            </div>
          </div>

          <div className={styles.results}>
            <div className={styles.emiBox}>
              <span className={styles.emiLabel}>Monthly EMI</span>
              <span className={styles.emiValue}>{formatCurrency(emi)}</span>
            </div>
            <div className={styles.resultRow}>
              <span>Loan Amount</span>
              <span className={styles.resultValue}>{formatCurrency(loanAmount)}</span>
            </div>
            <div className={styles.resultRow}>
              <span>Total Interest</span>
              <span className={styles.resultValue}>{formatCurrency(totalInterest)}</span>
            </div>
            <div className={`${styles.resultRow} ${styles.resultTotal}`}>
              <span>Total Amount</span>
              <span className={styles.resultValue}>{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>

        <div className={styles.steps}>
          <Icon icon="mdi:information-outline" className={styles.stepsIcon} />
          <span>Get Approval in 3 simple steps: Submit Documents → Get Eligibility → Loan Sanctioned</span>
        </div>
      </motion.div>
    </section>
  );
};

export default FinanceGuide;
