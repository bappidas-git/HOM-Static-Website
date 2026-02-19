import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useInView } from 'react-intersection-observer';
import { leadService } from '../../../services/api';
import styles from './FinanceGuide.module.css';

const formatCurrency = (val) => {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
  return `₹${Math.round(val).toLocaleString('en-IN')}`;
};

/* ─── Bank Data ─── */
const banks = [
  { name: 'HDFC Bank', icon: 'mdi:bank', rate: 8.35, maxLoan: 50000000, color: '#004B87' },
  { name: 'SBI', icon: 'mdi:bank', rate: 8.40, maxLoan: 50000000, color: '#22409A' },
  { name: 'Axis Bank', icon: 'mdi:bank', rate: 8.55, maxLoan: 50000000, color: '#97144D' },
  { name: 'ICICI Bank', icon: 'mdi:bank', rate: 8.45, maxLoan: 30000000, color: '#F37021' },
  { name: 'Kotak Mahindra', icon: 'mdi:bank', rate: 8.70, maxLoan: 30000000, color: '#ED1C24' },
  { name: 'LIC Housing', icon: 'mdi:bank', rate: 8.50, maxLoan: 50000000, color: '#0072BC' },
];

/* ─── Assessment Options ─── */
const occupationOptions = [
  { value: 'salaried', label: 'Salaried', icon: 'mdi:briefcase-outline' },
  { value: 'self-employed', label: 'Self-Employed', icon: 'mdi:account-tie-outline' },
  { value: 'business-owner', label: 'Business Owner', icon: 'mdi:store-outline' },
  { value: 'professional', label: 'Professional', icon: 'mdi:school-outline' },
  { value: 'retired', label: 'Retired', icon: 'mdi:beach' },
];

const incomeRanges = [
  { value: '0-3', label: 'Below ₹3 Lakhs' },
  { value: '3-5', label: '₹3 - 5 Lakhs' },
  { value: '5-10', label: '₹5 - 10 Lakhs' },
  { value: '10-20', label: '₹10 - 20 Lakhs' },
  { value: '20-50', label: '₹20 - 50 Lakhs' },
  { value: '50+', label: 'Above ₹50 Lakhs' },
];

const creditScoreOptions = [
  { value: 'excellent', label: 'Excellent (750+)', color: '#10B981' },
  { value: 'good', label: 'Good (700-749)', color: '#3B82F6' },
  { value: 'fair', label: 'Fair (650-699)', color: '#F59E0B' },
  { value: 'poor', label: 'Poor (Below 650)', color: '#EF4444' },
  { value: 'not-sure', label: 'Not Sure', color: '#6B7280' },
];

const existingEmiOptions = [
  { value: '0', label: 'No existing EMIs' },
  { value: '1-10000', label: 'Up to ₹10,000' },
  { value: '10000-25000', label: '₹10,000 - ₹25,000' },
  { value: '25000-50000', label: '₹25,000 - ₹50,000' },
  { value: '50000+', label: 'Above ₹50,000' },
];

const employmentYearOptions = [
  { value: '0-1', label: 'Less than 1 year' },
  { value: '1-3', label: '1 - 3 years' },
  { value: '3-5', label: '3 - 5 years' },
  { value: '5-10', label: '5 - 10 years' },
  { value: '10+', label: '10+ years' },
];

/* ─── Score Calculation ─── */
const calculateFitScore = (data) => {
  let score = 0;

  // Income score (max 30)
  const incomeScores = { '0-3': 5, '3-5': 12, '5-10': 20, '10-20': 25, '20-50': 28, '50+': 30 };
  score += incomeScores[data.yearlyIncome] || 0;

  // Credit score (max 25)
  const creditScores = { 'excellent': 25, 'good': 20, 'fair': 12, 'poor': 5, 'not-sure': 10 };
  score += creditScores[data.creditScore] || 0;

  // Existing EMI burden (max 20)
  const emiScores = { '0': 20, '1-10000': 16, '10000-25000': 12, '25000-50000': 6, '50000+': 2 };
  score += emiScores[data.existingEmi] || 0;

  // Employment stability (max 15)
  const empScores = { '0-1': 3, '1-3': 8, '3-5': 11, '5-10': 13, '10+': 15 };
  score += empScores[data.employmentYears] || 0;

  // Down payment (max 10)
  const dp = parseInt(data.downPayment) || 0;
  if (dp >= 30) score += 10;
  else if (dp >= 20) score += 8;
  else if (dp >= 15) score += 5;
  else if (dp >= 10) score += 3;

  return Math.min(score, 100);
};

const getScoreLabel = (score) => {
  if (score >= 80) return { label: 'Excellent', color: '#10B981', bg: '#ECFDF5', icon: 'mdi:check-decagram', message: 'You have an excellent financial profile for home ownership. You are likely to get the best interest rates and quick loan approval.' };
  if (score >= 60) return { label: 'Good', color: '#3B82F6', bg: '#EFF6FF', icon: 'mdi:thumb-up', message: 'Your financial profile looks good for a home loan. You should be eligible for competitive rates from most banks.' };
  if (score >= 40) return { label: 'Moderate', color: '#F59E0B', bg: '#FFFBEB', icon: 'mdi:alert-circle-outline', message: 'Your profile is moderate. Consider reducing existing liabilities or increasing your down payment for better loan terms.' };
  return { label: 'Needs Improvement', color: '#EF4444', bg: '#FEF2F2', icon: 'mdi:information-outline', message: 'We recommend strengthening your financial profile before applying. Our advisors can help you plan a path to home ownership.' };
};


const FinanceGuide = ({ price = 0, property = null }) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  /* ─── EMI Calculator State ─── */
  const [loanPercent, setLoanPercent] = useState(80);
  const [interestRate, setInterestRate] = useState(8.5);
  const [tenure, setTenure] = useState(20);

  const loanAmount = (price * loanPercent) / 100;
  const downPaymentAmount = price - loanAmount;

  const emi = useMemo(() => {
    const r = interestRate / 12 / 100;
    const n = tenure * 12;
    if (r === 0) return loanAmount / n;
    return (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }, [loanAmount, interestRate, tenure]);

  const totalAmount = emi * tenure * 12;
  const totalInterest = totalAmount - loanAmount;
  const principalPercent = loanAmount > 0 ? Math.round((loanAmount / totalAmount) * 100) : 0;
  const interestPercent = 100 - principalPercent;

  /* ─── Assessment State ─── */
  const [assessmentStep, setAssessmentStep] = useState(0); // 0=form, 1=result, 2=thankyou
  const [assessmentData, setAssessmentData] = useState({
    name: '',
    phone: '',
    email: '',
    occupation: '',
    yearlyIncome: '',
    employmentYears: '',
    existingEmi: '',
    creditScore: '',
    downPayment: '20',
    hasCoApplicant: '',
    coApplicantIncome: '',
  });
  const [assessmentErrors, setAssessmentErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [fitScore, setFitScore] = useState(null);

  /* ─── Active Section Tabs ─── */
  const [activeTab, setActiveTab] = useState('assessment');

  /* ─── View More Banks State ─── */
  const [showAllBanks, setShowAllBanks] = useState(false);
  const [initialBankCount, setInitialBankCount] = useState(3);

  /* ─── Eligibility Modal State ─── */
  const [eligibilityModal, setEligibilityModal] = useState({ open: false, bank: null });
  const [modalFormData, setModalFormData] = useState({
    name: '', phone: '', email: '', occupation: '', yearlyIncome: '',
    employmentYears: '', existingEmi: '', creditScore: '', downPayment: '20',
    hasCoApplicant: '', coApplicantIncome: '',
  });
  const [modalErrors, setModalErrors] = useState({});
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalStep, setModalStep] = useState(0); // 0=form, 1=result
  const [modalFitScore, setModalFitScore] = useState(null);

  useEffect(() => {
    const updateBankCount = () => {
      setInitialBankCount(window.innerWidth > 960 ? 3 : 1);
    };
    updateBankCount();
    window.addEventListener('resize', updateBankCount);
    return () => window.removeEventListener('resize', updateBankCount);
  }, []);

  const visibleBanks = showAllBanks ? banks : banks.slice(0, initialBankCount);

  const handleAssessmentChange = useCallback((field, value) => {
    setAssessmentData((prev) => ({ ...prev, [field]: value }));
    setAssessmentErrors((prev) => ({ ...prev, [field]: '' }));
  }, []);

  const validateAssessment = useCallback(() => {
    const errors = {};
    if (!assessmentData.name.trim()) errors.name = 'Name is required';
    if (!assessmentData.phone.trim()) errors.phone = 'Phone is required';
    else if (!/^[6-9]\d{9}$/.test(assessmentData.phone.trim())) errors.phone = 'Enter a valid 10-digit phone number';
    if (assessmentData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(assessmentData.email)) errors.email = 'Enter a valid email';
    if (!assessmentData.occupation) errors.occupation = 'Select your occupation';
    if (!assessmentData.yearlyIncome) errors.yearlyIncome = 'Select your income range';
    if (!assessmentData.creditScore) errors.creditScore = 'Select your credit score range';
    if (!assessmentData.existingEmi) errors.existingEmi = 'Select existing EMI';
    if (!assessmentData.employmentYears) errors.employmentYears = 'Select employment duration';
    setAssessmentErrors(errors);
    return Object.keys(errors).length === 0;
  }, [assessmentData]);

  const handleAssessmentSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!validateAssessment()) return;

    const score = calculateFitScore(assessmentData);
    setFitScore(score);

    try {
      setSubmitting(true);
      await leadService.create({
        name: assessmentData.name,
        phone: assessmentData.phone,
        email: assessmentData.email || '',
        propertyId: property?.id || null,
        source: 'financial-assessment',
        message: `Financial Assessment Lead | Score: ${score}/100 | Occupation: ${assessmentData.occupation} | Income: ${assessmentData.yearlyIncome} LPA | Credit: ${assessmentData.creditScore} | EMI: ${assessmentData.existingEmi} | Employment: ${assessmentData.employmentYears} yrs | Down Payment: ${assessmentData.downPayment}% | Co-applicant: ${assessmentData.hasCoApplicant || 'No'}${assessmentData.coApplicantIncome ? ' (Income: ' + assessmentData.coApplicantIncome + ')' : ''}`,
        assessmentData: {
          score,
          occupation: assessmentData.occupation,
          yearlyIncome: assessmentData.yearlyIncome,
          employmentYears: assessmentData.employmentYears,
          existingEmi: assessmentData.existingEmi,
          creditScore: assessmentData.creditScore,
          downPayment: assessmentData.downPayment,
          hasCoApplicant: assessmentData.hasCoApplicant,
          coApplicantIncome: assessmentData.coApplicantIncome,
          propertyPrice: price,
        },
      });
      setAssessmentStep(1);
    } catch {
      setAssessmentStep(1);
    } finally {
      setSubmitting(false);
    }
  }, [assessmentData, property?.id, price, validateAssessment]);

  /* ─── Eligibility Modal Handlers ─── */
  const openEligibilityModal = useCallback((bank) => {
    setEligibilityModal({ open: true, bank });
    setModalStep(0);
    setModalFormData({
      name: '', phone: '', email: '', occupation: '', yearlyIncome: '',
      employmentYears: '', existingEmi: '', creditScore: '', downPayment: '20',
      hasCoApplicant: '', coApplicantIncome: '',
    });
    setModalErrors({});
    setModalFitScore(null);
    document.body.style.overflow = 'hidden';
  }, []);

  const closeEligibilityModal = useCallback(() => {
    setEligibilityModal({ open: false, bank: null });
    setModalStep(0);
    document.body.style.overflow = '';
  }, []);

  const handleModalChange = useCallback((field, value) => {
    setModalFormData((prev) => ({ ...prev, [field]: value }));
    setModalErrors((prev) => ({ ...prev, [field]: '' }));
  }, []);

  const validateModalForm = useCallback(() => {
    const errors = {};
    if (!modalFormData.name.trim()) errors.name = 'Name is required';
    if (!modalFormData.phone.trim()) errors.phone = 'Phone is required';
    else if (!/^[6-9]\d{9}$/.test(modalFormData.phone.trim())) errors.phone = 'Enter a valid 10-digit phone number';
    if (modalFormData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(modalFormData.email)) errors.email = 'Enter a valid email';
    if (!modalFormData.occupation) errors.occupation = 'Select your occupation';
    if (!modalFormData.yearlyIncome) errors.yearlyIncome = 'Select your income range';
    if (!modalFormData.creditScore) errors.creditScore = 'Select your credit score range';
    if (!modalFormData.existingEmi) errors.existingEmi = 'Select existing EMI';
    if (!modalFormData.employmentYears) errors.employmentYears = 'Select employment duration';
    setModalErrors(errors);
    return Object.keys(errors).length === 0;
  }, [modalFormData]);

  const handleModalSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!validateModalForm()) return;

    const score = calculateFitScore(modalFormData);
    setModalFitScore(score);

    try {
      setModalSubmitting(true);
      await leadService.create({
        name: modalFormData.name,
        phone: modalFormData.phone,
        email: modalFormData.email || '',
        propertyId: property?.id || null,
        source: 'bank-eligibility-check',
        message: `Bank Eligibility Check — ${eligibilityModal.bank?.name} | Score: ${score}/100 | Occupation: ${modalFormData.occupation} | Income: ${modalFormData.yearlyIncome} LPA | Credit: ${modalFormData.creditScore} | EMI: ${modalFormData.existingEmi} | Employment: ${modalFormData.employmentYears} yrs | Down Payment: ${modalFormData.downPayment}% | Co-applicant: ${modalFormData.hasCoApplicant || 'No'}${modalFormData.coApplicantIncome ? ' (Income: ' + modalFormData.coApplicantIncome + ')' : ''}`,
        assessmentData: {
          score,
          bank: eligibilityModal.bank?.name,
          occupation: modalFormData.occupation,
          yearlyIncome: modalFormData.yearlyIncome,
          employmentYears: modalFormData.employmentYears,
          existingEmi: modalFormData.existingEmi,
          creditScore: modalFormData.creditScore,
          downPayment: modalFormData.downPayment,
          hasCoApplicant: modalFormData.hasCoApplicant,
          coApplicantIncome: modalFormData.coApplicantIncome,
          propertyPrice: price,
        },
      });
      setModalStep(1);
    } catch {
      setModalStep(1);
    } finally {
      setModalSubmitting(false);
    }
  }, [modalFormData, eligibilityModal.bank, property?.id, price, validateModalForm]);

  // Cleanup body overflow on unmount
  useEffect(() => {
    return () => { document.body.style.overflow = ''; };
  }, []);

  /* ─── Reusable Form Fields Renderer ─── */
  const renderFormFields = (data, errors, onChange) => (
    <>
      {/* ── Personal Details ── */}
      <div className={styles.formSection}>
        <h4 className={styles.formSectionTitle}>
          <Icon icon="mdi:account-outline" /> Personal Details
        </h4>
        <div className={styles.formGrid3}>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Full Name *</label>
            <input
              type="text"
              className={`${styles.formInput} ${errors.name ? styles.formInputError : ''}`}
              placeholder="Enter your full name"
              value={data.name}
              onChange={(e) => onChange('name', e.target.value)}
            />
            {errors.name && <span className={styles.fieldError}>{errors.name}</span>}
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Phone Number *</label>
            <input
              type="tel"
              className={`${styles.formInput} ${errors.phone ? styles.formInputError : ''}`}
              placeholder="10-digit mobile number"
              value={data.phone}
              onChange={(e) => onChange('phone', e.target.value)}
              maxLength={10}
            />
            {errors.phone && <span className={styles.fieldError}>{errors.phone}</span>}
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Email Address</label>
            <input
              type="email"
              className={`${styles.formInput} ${errors.email ? styles.formInputError : ''}`}
              placeholder="your@email.com"
              value={data.email}
              onChange={(e) => onChange('email', e.target.value)}
            />
            {errors.email && <span className={styles.fieldError}>{errors.email}</span>}
          </div>
        </div>
      </div>

      {/* ── Occupation ── */}
      <div className={styles.formSection}>
        <h4 className={styles.formSectionTitle}>
          <Icon icon="mdi:briefcase-outline" /> Employment Details
        </h4>
        <label className={styles.formLabel}>Occupation Type *</label>
        <div className={styles.chipSelector}>
          {occupationOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`${styles.chipOption} ${data.occupation === opt.value ? styles.chipOptionActive : ''}`}
              onClick={() => onChange('occupation', opt.value)}
            >
              <Icon icon={opt.icon} />
              {opt.label}
            </button>
          ))}
        </div>
        {errors.occupation && <span className={styles.fieldError}>{errors.occupation}</span>}

        <div className={styles.formGrid2} style={{ marginTop: '16px' }}>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Years of Employment / Business *</label>
            <select
              className={`${styles.formSelect} ${errors.employmentYears ? styles.formInputError : ''}`}
              value={data.employmentYears}
              onChange={(e) => onChange('employmentYears', e.target.value)}
            >
              <option value="">Select duration</option>
              {employmentYearOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {errors.employmentYears && <span className={styles.fieldError}>{errors.employmentYears}</span>}
          </div>
        </div>
      </div>

      {/* ── Financial Details ── */}
      <div className={styles.formSection}>
        <h4 className={styles.formSectionTitle}>
          <Icon icon="mdi:currency-inr" /> Financial Details
        </h4>
        <div className={styles.formGrid2}>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Annual Income *</label>
            <select
              className={`${styles.formSelect} ${errors.yearlyIncome ? styles.formInputError : ''}`}
              value={data.yearlyIncome}
              onChange={(e) => onChange('yearlyIncome', e.target.value)}
            >
              <option value="">Select income range</option>
              {incomeRanges.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {errors.yearlyIncome && <span className={styles.fieldError}>{errors.yearlyIncome}</span>}
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Existing Monthly EMIs *</label>
            <select
              className={`${styles.formSelect} ${errors.existingEmi ? styles.formInputError : ''}`}
              value={data.existingEmi}
              onChange={(e) => onChange('existingEmi', e.target.value)}
            >
              <option value="">Select EMI range</option>
              {existingEmiOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {errors.existingEmi && <span className={styles.fieldError}>{errors.existingEmi}</span>}
          </div>
        </div>

        <label className={styles.formLabel} style={{ marginTop: '16px' }}>Credit Score Range *</label>
        <div className={styles.chipSelector}>
          {creditScoreOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`${styles.chipOption} ${data.creditScore === opt.value ? styles.chipOptionActive : ''}`}
              onClick={() => onChange('creditScore', opt.value)}
              style={data.creditScore === opt.value ? { borderColor: opt.color, background: `${opt.color}10` } : {}}
            >
              <span className={styles.creditDot} style={{ background: opt.color }} />
              {opt.label}
            </button>
          ))}
        </div>
        {errors.creditScore && <span className={styles.fieldError}>{errors.creditScore}</span>}

        <div className={styles.formGrid2} style={{ marginTop: '16px' }}>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Down Payment Available ({data.downPayment}%)</label>
            <input
              type="range"
              min="10"
              max="50"
              value={data.downPayment}
              onChange={(e) => onChange('downPayment', e.target.value)}
              className={styles.rangeSlider}
            />
            <div className={styles.rangeLabels}>
              <span>10%</span>
              <span className={styles.rangeCurrentVal}>{formatCurrency(price * (parseInt(data.downPayment) || 0) / 100)}</span>
              <span>50%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Co-Applicant ── */}
      <div className={styles.formSection}>
        <h4 className={styles.formSectionTitle}>
          <Icon icon="mdi:account-multiple-outline" /> Co-Applicant (Optional)
        </h4>
        <div className={styles.formGrid2}>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Do you have a co-applicant?</label>
            <div className={styles.toggleRow}>
              <button
                type="button"
                className={`${styles.toggleBtn} ${data.hasCoApplicant === 'yes' ? styles.toggleBtnActive : ''}`}
                onClick={() => onChange('hasCoApplicant', 'yes')}
              >
                Yes
              </button>
              <button
                type="button"
                className={`${styles.toggleBtn} ${data.hasCoApplicant === 'no' ? styles.toggleBtnActive : ''}`}
                onClick={() => onChange('hasCoApplicant', 'no')}
              >
                No
              </button>
            </div>
          </div>
          {data.hasCoApplicant === 'yes' && (
            <div className={styles.formField}>
              <label className={styles.formLabel}>Co-Applicant Annual Income</label>
              <select
                className={styles.formSelect}
                value={data.coApplicantIncome}
                onChange={(e) => onChange('coApplicantIncome', e.target.value)}
              >
                <option value="">Select income range</option>
                {incomeRanges.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </>
  );

  if (!price) return null;

  const scoreInfo = fitScore !== null ? getScoreLabel(fitScore) : null;

  const tabs = [
    { id: 'assessment', label: 'Financial Fit Assessment', icon: 'mdi:clipboard-check-outline' },
    { id: 'finance', label: 'Bank Loan Assistance', icon: 'mdi:bank-check' },
    { id: 'emi', label: 'EMI Projections', icon: 'mdi:calculator-variant' },
  ];

  return (
    <section className={styles.section} ref={ref} id="finance">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
      >
        <h2 className={styles.sectionTitle}>Bank Loan Assistance</h2>
        <p className={styles.sectionSubtitle}>
          Comprehensive financial planning tools to help you make an informed property investment decision
        </p>

        {/* ─── Tab Navigation ─── */}
        <div className={styles.tabNav}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon icon={tab.icon} className={styles.tabIcon} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TAB 1: Home Finance Clarity — Bank Cards                  */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'finance' && (
          <motion.div
            key="finance"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Top Banner */}
            <div className={styles.financeBanner}>
              <div className={styles.financeBannerIcon}>
                <Icon icon="mdi:shield-check" />
              </div>
              <div className={styles.financeBannerText}>
                <h3>Banks Approved</h3>
                <p>This property is pre-approved for home loans from India&apos;s top banks with competitive rates starting from <strong>8.35% p.a.</strong></p>
              </div>
            </div>

            {/* Highlight Stats Bar */}
            <div className={styles.statsBar}>
              <div className={styles.statItem}>
                <Icon icon="mdi:percent-circle" className={styles.statIcon} />
                <div>
                  <span className={styles.statValue}>8.35%</span>
                  <span className={styles.statLabel}>Lowest Rate</span>
                </div>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <Icon icon="mdi:clock-fast" className={styles.statIcon} />
                <div>
                  <span className={styles.statValue}>48 Hrs</span>
                  <span className={styles.statLabel}>Quick Approval</span>
                </div>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <Icon icon="mdi:cash-multiple" className={styles.statIcon} />
                <div>
                  <span className={styles.statValue}>Up to 90%</span>
                  <span className={styles.statLabel}>Financing</span>
                </div>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <Icon icon="mdi:file-document-check" className={styles.statIcon} />
                <div>
                  <span className={styles.statValue}>Minimal</span>
                  <span className={styles.statLabel}>Documentation</span>
                </div>
              </div>
            </div>

            {/* Bank Cards Grid */}
            <div className={styles.bankGrid}>
              {visibleBanks.map((bank, idx) => (
                <motion.div
                  key={idx}
                  className={styles.bankCard}
                  initial={{ opacity: 0, y: 16 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.35, delay: 0.1 + idx * 0.06 }}
                >
                  <div className={styles.bankCardHeader}>
                    <div className={styles.bankIconWrap} style={{ background: `${bank.color}15` }}>
                      <Icon icon={bank.icon} className={styles.bankIconLg} style={{ color: bank.color }} />
                    </div>
                    <div className={styles.bankNameBlock}>
                      <span className={styles.bankName}>{bank.name}</span>
                      <span className={styles.preApprovedBadge}>
                        <Icon icon="mdi:check-circle" /> Pre-Approved
                      </span>
                    </div>
                  </div>
                  <div className={styles.bankCardBody}>
                    <div className={styles.bankRateRow}>
                      <span className={styles.bankRateLabel}>Interest Rate</span>
                      <span className={styles.bankRateValue}>{bank.rate}% <small>p.a. onwards</small></span>
                    </div>
                    <div className={styles.bankRateRow}>
                      <span className={styles.bankRateLabel}>Max Loan</span>
                      <span className={styles.bankRateValue}>{formatCurrency(bank.maxLoan)}</span>
                    </div>
                    <div className={styles.bankRateRow}>
                      <span className={styles.bankRateLabel}>Processing Fee</span>
                      <span className={styles.bankRateValue}>0.5%<small> + GST</small></span>
                    </div>
                  </div>
                  <button className={styles.bankCta} onClick={() => openEligibilityModal(bank)}>
                    <Icon icon="mdi:check-decagram-outline" />
                    Check Eligibility
                  </button>
                </motion.div>
              ))}
            </div>

            {/* View More / Show Less Banks Button */}
            {banks.length > initialBankCount && (
              <div className={styles.viewMoreWrap}>
                {!showAllBanks ? (
                  <button
                    className={styles.viewMoreBtn}
                    onClick={() => setShowAllBanks(true)}
                  >
                    <Icon icon="mdi:bank-plus" />
                    <span className={styles.viewMoreTextDesktop}>View More Banks</span>
                    <span className={styles.viewMoreTextMobile}>View More Bank</span>
                    <Icon icon="mdi:chevron-down" />
                  </button>
                ) : (
                  <button
                    className={styles.viewMoreBtn}
                    onClick={() => setShowAllBanks(false)}
                  >
                    <Icon icon="mdi:chevron-up" />
                    Show Less
                  </button>
                )}
              </div>
            )}

            {/* Approval Steps */}
            <div className={styles.approvalSteps}>
              <h4 className={styles.approvalStepsTitle}>
                <Icon icon="mdi:rocket-launch-outline" /> Get Loan Approval in 3 Simple Steps
              </h4>
              <div className={styles.stepsRow}>
                <div className={styles.stepCard}>
                  <div className={styles.stepNumber}>1</div>
                  <span className={styles.stepLabel}>Submit Documents</span>
                  <span className={styles.stepDesc}>Upload KYC &amp; income proofs</span>
                </div>
                <div className={styles.stepConnector}>
                  <Icon icon="mdi:chevron-right" />
                </div>
                <div className={styles.stepCard}>
                  <div className={styles.stepNumber}>2</div>
                  <span className={styles.stepLabel}>Get Eligibility</span>
                  <span className={styles.stepDesc}>Instant pre-approval check</span>
                </div>
                <div className={styles.stepConnector}>
                  <Icon icon="mdi:chevron-right" />
                </div>
                <div className={styles.stepCard}>
                  <div className={styles.stepNumber}>3</div>
                  <span className={styles.stepLabel}>Loan Sanctioned</span>
                  <span className={styles.stepDesc}>Disbursement within 48 hrs</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TAB 2: Financial Fit Assessment                           */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'assessment' && (
          <motion.div
            key="assessment"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AnimatePresence mode="wait">
              {assessmentStep === 0 && (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className={styles.assessmentHeader}>
                    <div className={styles.assessmentHeaderIcon}>
                      <Icon icon="mdi:finance" />
                    </div>
                    <div>
                      <h3 className={styles.assessmentTitle}>Discover Your Home Buying Power</h3>
                      <p className={styles.assessmentDesc}>
                        Answer a few quick questions to get a personalised financial fit score and expert recommendations for this property worth <strong>{formatCurrency(price)}</strong>.
                      </p>
                    </div>
                  </div>

                  <form className={styles.assessmentForm} onSubmit={handleAssessmentSubmit}>
                    {renderFormFields(assessmentData, assessmentErrors, handleAssessmentChange)}

                    {/* ── Submit ── */}
                    <div className={styles.assessmentSubmitWrap}>
                      <button
                        type="submit"
                        className={styles.assessmentSubmitBtn}
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <Icon icon="mdi:loading" className={styles.spinIcon} />
                            Analyzing Your Profile...
                          </>
                        ) : (
                          <>
                            <Icon icon="mdi:chart-box-outline" />
                            Get My Financial Fit Score
                          </>
                        )}
                      </button>
                      <p className={styles.privacyNote}>
                        <Icon icon="mdi:lock-outline" /> Your data is secure and used only for this assessment
                      </p>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* ── Assessment Result ── */}
              {assessmentStep === 1 && scoreInfo && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
                  className={styles.resultContainer}
                >
                  <div className={styles.resultCard}>
                    <div className={styles.resultHeader}>
                      <div className={styles.scoreCircle} style={{ borderColor: scoreInfo.color }}>
                        <span className={styles.scoreNumber} style={{ color: scoreInfo.color }}>{fitScore}</span>
                        <span className={styles.scoreOutOf}>/ 100</span>
                      </div>
                      <div className={styles.resultMeta}>
                        <div className={styles.scoreBadge} style={{ background: scoreInfo.bg, color: scoreInfo.color }}>
                          <Icon icon={scoreInfo.icon} />
                          {scoreInfo.label}
                        </div>
                        <h3 className={styles.resultTitle}>Your Financial Fit Score</h3>
                        <p className={styles.resultDesc}>{scoreInfo.message}</p>
                      </div>
                    </div>

                    {/* Score Breakdown */}
                    <div className={styles.scoreBreakdown}>
                      <h4 className={styles.breakdownTitle}>Score Breakdown</h4>
                      <div className={styles.breakdownGrid}>
                        {[
                          { label: 'Income Level', icon: 'mdi:currency-inr', max: 30 },
                          { label: 'Credit Health', icon: 'mdi:shield-check', max: 25 },
                          { label: 'Debt Burden', icon: 'mdi:scale-balance', max: 20 },
                          { label: 'Job Stability', icon: 'mdi:briefcase-check', max: 15 },
                          { label: 'Down Payment', icon: 'mdi:piggy-bank-outline', max: 10 },
                        ].map((item, idx) => {
                          const categoryScores = {
                            'Income Level': { '0-3': 5, '3-5': 12, '5-10': 20, '10-20': 25, '20-50': 28, '50+': 30 },
                            'Credit Health': { 'excellent': 25, 'good': 20, 'fair': 12, 'poor': 5, 'not-sure': 10 },
                            'Debt Burden': { '0': 20, '1-10000': 16, '10000-25000': 12, '25000-50000': 6, '50000+': 2 },
                            'Job Stability': { '0-1': 3, '1-3': 8, '3-5': 11, '5-10': 13, '10+': 15 },
                            'Down Payment': {},
                          };
                          let val = 0;
                          if (item.label === 'Income Level') val = categoryScores['Income Level'][assessmentData.yearlyIncome] || 0;
                          else if (item.label === 'Credit Health') val = categoryScores['Credit Health'][assessmentData.creditScore] || 0;
                          else if (item.label === 'Debt Burden') val = categoryScores['Debt Burden'][assessmentData.existingEmi] || 0;
                          else if (item.label === 'Job Stability') val = categoryScores['Job Stability'][assessmentData.employmentYears] || 0;
                          else {
                            const dp = parseInt(assessmentData.downPayment) || 0;
                            if (dp >= 30) val = 10;
                            else if (dp >= 20) val = 8;
                            else if (dp >= 15) val = 5;
                            else if (dp >= 10) val = 3;
                          }
                          const pct = Math.round((val / item.max) * 100);
                          return (
                            <div key={idx} className={styles.breakdownItem}>
                              <div className={styles.breakdownItemTop}>
                                <Icon icon={item.icon} className={styles.breakdownIcon} />
                                <span className={styles.breakdownLabel}>{item.label}</span>
                                <span className={styles.breakdownScore}>{val}/{item.max}</span>
                              </div>
                              <div className={styles.breakdownBar}>
                                <div
                                  className={styles.breakdownBarFill}
                                  style={{ width: `${pct}%`, background: pct >= 70 ? '#10B981' : pct >= 40 ? '#F59E0B' : '#EF4444' }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div className={styles.recommendations}>
                      <h4 className={styles.recoTitle}>
                        <Icon icon="mdi:lightbulb-outline" /> Recommendations
                      </h4>
                      <div className={styles.recoList}>
                        {fitScore >= 60 && (
                          <div className={styles.recoItem}>
                            <Icon icon="mdi:check-circle" style={{ color: '#10B981' }} />
                            <span>You are eligible for pre-approved home loans from multiple banks for this property.</span>
                          </div>
                        )}
                        {fitScore < 80 && assessmentData.creditScore !== 'excellent' && (
                          <div className={styles.recoItem}>
                            <Icon icon="mdi:arrow-up-circle" style={{ color: '#3B82F6' }} />
                            <span>Improving your credit score can help you secure better interest rates.</span>
                          </div>
                        )}
                        {assessmentData.existingEmi !== '0' && (
                          <div className={styles.recoItem}>
                            <Icon icon="mdi:information" style={{ color: '#F59E0B' }} />
                            <span>Clearing existing loans before applying can significantly improve your eligibility.</span>
                          </div>
                        )}
                        {parseInt(assessmentData.downPayment) < 20 && (
                          <div className={styles.recoItem}>
                            <Icon icon="mdi:piggy-bank-outline" style={{ color: '#8B5CF6' }} />
                            <span>A higher down payment (20%+) can lower your EMI and improve loan approval chances.</span>
                          </div>
                        )}
                        <div className={styles.recoItem}>
                          <Icon icon="mdi:phone-outline" style={{ color: '#C9A86C' }} />
                          <span>Our financial advisors will contact you shortly with personalised loan options.</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.resultActions}>
                      <button className={styles.resultPrimaryBtn} onClick={() => setAssessmentStep(2)}>
                        <Icon icon="mdi:check" /> Done
                      </button>
                      <button className={styles.resultSecondaryBtn} onClick={() => { setAssessmentStep(0); setFitScore(null); }}>
                        <Icon icon="mdi:refresh" /> Retake Assessment
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── Thank You ── */}
              {assessmentStep === 2 && (
                <motion.div
                  key="thankyou"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className={styles.thankYouWrap}
                >
                  <div className={styles.thankYouCard}>
                    <div className={styles.thankYouIconWrap}>
                      <Icon icon="mdi:check-circle" className={styles.thankYouIcon} />
                    </div>
                    <h3 className={styles.thankYouTitle}>Thank You, {assessmentData.name}!</h3>
                    <p className={styles.thankYouText}>
                      Your Financial Fit Assessment has been submitted successfully. Your score of <strong style={{ color: scoreInfo?.color }}>{fitScore}/100</strong> ({scoreInfo?.label}) has been recorded.
                    </p>
                    <p className={styles.thankYouSubtext}>
                      Our dedicated home loan advisors will reach out to you within 24 hours with personalised financing options tailored to your profile for this property.
                    </p>
                    <div className={styles.thankYouActions}>
                      <button className={styles.thankYouBtn} onClick={() => setActiveTab('emi')}>
                        <Icon icon="mdi:calculator-variant" /> View EMI Projections
                      </button>
                      <button className={styles.thankYouBtnOutline} onClick={() => { setAssessmentStep(0); setFitScore(null); }}>
                        <Icon icon="mdi:refresh" /> Start New Assessment
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TAB 3: EMI Projections                                    */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'emi' && (
          <motion.div
            key="emi"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className={styles.emiHeader}>
              <div className={styles.emiHeaderIcon}>
                <Icon icon="mdi:calculator-variant" />
              </div>
              <div>
                <h3 className={styles.emiHeaderTitle}>EMI Projection Calculator</h3>
                <p className={styles.emiHeaderDesc}>Plan your monthly payments for <strong>{formatCurrency(price)}</strong> property</p>
              </div>
            </div>

            <div className={styles.emiGrid}>
              {/* Left: Calculator Controls */}
              <div className={styles.emiCalculator}>
                <div className={styles.emiPropertyPrice}>
                  <span className={styles.emiPriceLabel}>Property Price</span>
                  <span className={styles.emiPriceValue}>{formatCurrency(price)}</span>
                </div>

                <div className={styles.emiInputGroup}>
                  <div className={styles.emiInputHeader}>
                    <label className={styles.emiLabel}>
                      <Icon icon="mdi:cash-multiple" /> Loan Amount ({loanPercent}%)
                    </label>
                    <span className={styles.emiInputVal}>{formatCurrency(loanAmount)}</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="90"
                    value={loanPercent}
                    onChange={(e) => setLoanPercent(Number(e.target.value))}
                    className={styles.rangeSlider}
                  />
                  <div className={styles.rangeLabels}>
                    <span>50%</span>
                    <span>90%</span>
                  </div>
                </div>

                <div className={styles.emiInputGroup}>
                  <div className={styles.emiInputHeader}>
                    <label className={styles.emiLabel}>
                      <Icon icon="mdi:percent" /> Interest Rate
                    </label>
                    <span className={styles.emiInputVal}>{interestRate}% p.a.</span>
                  </div>
                  <input
                    type="range"
                    min="6"
                    max="14"
                    step="0.1"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    className={styles.rangeSlider}
                  />
                  <div className={styles.rangeLabels}>
                    <span>6%</span>
                    <span>14%</span>
                  </div>
                </div>

                <div className={styles.emiInputGroup}>
                  <div className={styles.emiInputHeader}>
                    <label className={styles.emiLabel}>
                      <Icon icon="mdi:calendar-range" /> Loan Tenure
                    </label>
                    <span className={styles.emiInputVal}>{tenure} years</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    value={tenure}
                    onChange={(e) => setTenure(Number(e.target.value))}
                    className={styles.rangeSlider}
                  />
                  <div className={styles.rangeLabels}>
                    <span>5 yrs</span>
                    <span>30 yrs</span>
                  </div>
                </div>
              </div>

              {/* Right: Results Panel */}
              <div className={styles.emiResults}>
                {/* EMI Hero */}
                <div className={styles.emiHeroBox}>
                  <span className={styles.emiHeroLabel}>Your Monthly EMI</span>
                  <span className={styles.emiHeroValue}>{formatCurrency(emi)}</span>
                  <span className={styles.emiHeroSub}>for {tenure} years at {interestRate}% p.a.</span>
                </div>

                {/* Visual Breakdown */}
                <div className={styles.emiBreakdownVisual}>
                  <div className={styles.emiBarContainer}>
                    <div className={styles.emiBarPrincipal} style={{ width: `${principalPercent}%` }}>
                      {principalPercent > 15 && <span>{principalPercent}%</span>}
                    </div>
                    <div className={styles.emiBarInterest} style={{ width: `${interestPercent}%` }}>
                      {interestPercent > 15 && <span>{interestPercent}%</span>}
                    </div>
                  </div>
                  <div className={styles.emiLegend}>
                    <div className={styles.emiLegendItem}>
                      <span className={styles.emiLegendDot} style={{ background: 'var(--color-primary)' }} />
                      Principal
                    </div>
                    <div className={styles.emiLegendItem}>
                      <span className={styles.emiLegendDot} style={{ background: 'var(--color-secondary)' }} />
                      Interest
                    </div>
                  </div>
                </div>

                {/* Summary Rows */}
                <div className={styles.emiSummary}>
                  <div className={styles.emiSummaryRow}>
                    <span className={styles.emiSummaryLabel}>
                      <Icon icon="mdi:cash" /> Loan Amount
                    </span>
                    <span className={styles.emiSummaryValue}>{formatCurrency(loanAmount)}</span>
                  </div>
                  <div className={styles.emiSummaryRow}>
                    <span className={styles.emiSummaryLabel}>
                      <Icon icon="mdi:arrow-down-circle" /> Down Payment
                    </span>
                    <span className={styles.emiSummaryValue}>{formatCurrency(downPaymentAmount)}</span>
                  </div>
                  <div className={styles.emiSummaryRow}>
                    <span className={styles.emiSummaryLabel}>
                      <Icon icon="mdi:percent-circle" /> Total Interest
                    </span>
                    <span className={styles.emiSummaryValue} style={{ color: '#EF4444' }}>{formatCurrency(totalInterest)}</span>
                  </div>
                  <div className={`${styles.emiSummaryRow} ${styles.emiSummaryTotal}`}>
                    <span className={styles.emiSummaryLabel}>
                      <Icon icon="mdi:sigma" /> Total Payable
                    </span>
                    <span className={styles.emiSummaryValue}>{formatCurrency(totalAmount)}</span>
                  </div>
                </div>

                {/* Interest Savings Tip */}
                <div className={styles.emiTip}>
                  <Icon icon="mdi:lightbulb-on-outline" className={styles.emiTipIcon} />
                  <span>
                    Tip: Increasing your down payment to {Math.min(loanPercent + 5, 90)}% can save you approx. {formatCurrency(totalInterest * 0.08)} in interest over the loan tenure.
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* Eligibility Check Modal                                    */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {eligibilityModal.open && eligibilityModal.bank && (
          <motion.div
            className={styles.eligibilityOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeEligibilityModal}
          >
            <motion.div
              className={styles.eligibilityModal}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className={styles.eligibilityHeader}>
                <div className={styles.eligibilityTitleWrap}>
                  <div
                    className={styles.eligibilityBankIcon}
                    style={{ background: `${eligibilityModal.bank.color}15` }}
                  >
                    <Icon
                      icon={eligibilityModal.bank.icon}
                      style={{ color: eligibilityModal.bank.color, fontSize: '1.3rem' }}
                    />
                  </div>
                  <div>
                    <h3 className={styles.eligibilityTitle}>
                      Check Eligibility with {eligibilityModal.bank.name}
                    </h3>
                    <p className={styles.eligibilitySubtitle}>
                      Rate from {eligibilityModal.bank.rate}% p.a. &bull; Max loan {formatCurrency(eligibilityModal.bank.maxLoan)}
                    </p>
                  </div>
                </div>
                <button
                  className={styles.eligibilityClose}
                  onClick={closeEligibilityModal}
                  aria-label="Close modal"
                >
                  <Icon icon="mdi:close" />
                </button>
              </div>

              {/* Modal Body */}
              <div className={styles.eligibilityBody}>
                <AnimatePresence mode="wait">
                  {modalStep === 0 && (
                    <motion.div
                      key="modal-form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.25 }}
                    >
                      <form className={styles.assessmentForm} onSubmit={handleModalSubmit}>
                        {renderFormFields(modalFormData, modalErrors, handleModalChange)}

                        {/* ── Submit ── */}
                        <div className={styles.assessmentSubmitWrap}>
                          <button
                            type="submit"
                            className={styles.assessmentSubmitBtn}
                            disabled={modalSubmitting}
                          >
                            {modalSubmitting ? (
                              <>
                                <Icon icon="mdi:loading" className={styles.spinIcon} />
                                Checking Eligibility...
                              </>
                            ) : (
                              <>
                                <Icon icon="mdi:check-decagram-outline" />
                                Check My Eligibility
                              </>
                            )}
                          </button>
                          <p className={styles.privacyNote}>
                            <Icon icon="mdi:lock-outline" /> Your data is secure and used only for this assessment
                          </p>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  {modalStep === 1 && modalFitScore !== null && (
                    <motion.div
                      key="modal-result"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.35, type: 'spring', stiffness: 200 }}
                    >
                      {(() => {
                        const mScoreInfo = getScoreLabel(modalFitScore);
                        return (
                          <div className={styles.eligibilityResult}>
                            <div className={styles.eligibilityResultIcon}>
                              <Icon icon="mdi:check-circle" />
                            </div>
                            <div className={styles.eligibilityScoreCircle} style={{ borderColor: mScoreInfo.color }}>
                              <span className={styles.eligibilityScoreNum} style={{ color: mScoreInfo.color }}>{modalFitScore}</span>
                              <span className={styles.eligibilityScoreOf}>/ 100</span>
                            </div>
                            <div
                              className={styles.eligibilityScoreBadge}
                              style={{ background: mScoreInfo.bg, color: mScoreInfo.color }}
                            >
                              <Icon icon={mScoreInfo.icon} />
                              {mScoreInfo.label}
                            </div>
                            <h3 className={styles.eligibilityResultTitle}>
                              Eligibility Assessment Complete
                            </h3>
                            <p className={styles.eligibilityResultText}>
                              {mScoreInfo.message}
                            </p>
                            <p className={styles.eligibilityResultSub}>
                              Our {eligibilityModal.bank.name} loan advisors will contact you within 24 hours with personalised financing options.
                            </p>
                            <div className={styles.eligibilityResultActions}>
                              <button
                                className={styles.eligibilityDoneBtn}
                                onClick={closeEligibilityModal}
                              >
                                <Icon icon="mdi:check" /> Done
                              </button>
                              <button
                                className={styles.eligibilityRetakeBtn}
                                onClick={() => { setModalStep(0); setModalFitScore(null); }}
                              >
                                <Icon icon="mdi:refresh" /> Retake
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default FinanceGuide;
