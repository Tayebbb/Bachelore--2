import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// Word Frame Component - decorative corner brackets around text
function WordFrame({ children }) {
  return (
    <span className="word-frame">
      {children}
    </span>
  );
}

// Reveal on scroll hook
function useRevealOnScroll() {
  const ref = useRef(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return [ref, isRevealed];
}

// Feature Card Component
function FeatureCard({ icon, title, description, delay = 0 }) {
  const [ref, isRevealed] = useRevealOnScroll();

  return (
    <div
      ref={ref}
      className={`feature-card reveal-on-scroll ${isRevealed ? 'revealed' : ''}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="feature-card-icon">
        <i className={`bi ${icon}`} />
      </div>
      <h4>{title}</h4>
      <p>{description}</p>
    </div>
  );
}

// Stepper Component
function Stepper() {
  const steps = [
    { icon: 'bi-cloud-upload', label: 'Upload' },
    { icon: 'bi-gear', label: 'Analyze' },
    { icon: 'bi-rocket-takeoff', label: 'Deploy' },
  ];

  return (
    <div className="hero-stepper">
      {steps.map((step, index) => (
        <React.Fragment key={step.label}>
          <div className="stepper-step">
            <span className="step-icon">
              <i className={`bi ${step.icon}`} />
            </span>
            <span>{step.label}</span>
          </div>
          {index < steps.length - 1 && <div className="stepper-connector" />}
        </React.Fragment>
      ))}
    </div>
  );
}

// FAQ Accordion Item
function AccordionItem({ question, answer, isOpen, onClick }) {
  return (
    <div className={`faq-accordion-item ${isOpen ? 'open' : ''}`}>
      <button className="faq-accordion-header" onClick={onClick}>
        <span>{question}</span>
        <i className="bi bi-chevron-down faq-accordion-icon" />
      </button>
      <div className="faq-accordion-content">
        <p>{answer}</p>
      </div>
    </div>
  );
}

// Logo Strip Component
function LogoStrip() {
  const logos = [
    'TechCorp', 'InnovateLabs', 'FutureSys', 'CloudNine', 'DataFlow',
    'BuildFast', 'ScaleUp', 'NextGen AI',
  ];

  return (
    <div className="logo-strip">
      <div className="container">
        <div className="logo-strip-label">Trusted by teams at</div>
        <div className="logo-grid">
          {logos.map((name) => (
            <div key={name} className="logo-item">
              {name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Main Component
export default function PublicHomeModern() {
  void motion;
  const [openFaq, setOpenFaq] = useState(0);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  // Respect system preference on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (!savedTheme) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const faqs = [
    {
      question: 'What services does BacheLORE provide?',
      answer: 'BacheLORE is an all-in-one platform for bachelor life management. We offer tuition assistance, maid services, roommate matching, house rent management, marketplace for goods, and subscription payment tracking.',
    },
    {
      question: 'How do I get started with the platform?',
      answer: 'Simply create an account, complete your profile, and start exploring our modules. Each service is designed to integrate seamlessly with the others, giving you a complete view of your bachelor life management.',
    },
    {
      question: 'Is my data secure on BacheLORE?',
      answer: 'Absolutely. We use industry-standard encryption and security practices. Your personal information and transaction data are protected with enterprise-grade security measures.',
    },
    {
      question: 'Can I use BacheLORE on mobile devices?',
      answer: 'Yes! BacheLORE is fully responsive and works beautifully on all devices - desktop, tablet, and mobile. Manage your bachelor life on the go.',
    },
  ];

  const features = [
    {
      icon: 'bi-journal-text',
      title: 'Tuition Management',
      description: 'Track and manage tuition payments, find tutors, and organize study schedules all in one place.',
    },
    {
      icon: 'bi-house-gear',
      title: 'Maid Services',
      description: 'Book reliable maid services for cleaning, cooking, and household chores with verified professionals.',
    },
    {
      icon: 'bi-people',
      title: 'Roommate Matching',
      description: 'Find compatible roommates based on preferences, lifestyle, and location with our smart matching algorithm.',
    },
    {
      icon: 'bi-building',
      title: 'House Rent',
      description: 'Browse rental listings, manage lease agreements, and track rent payments effortlessly.',
    },
    {
      icon: 'bi-bag-check',
      title: 'Marketplace',
      description: 'Buy and sell items within your community. From furniture to electronics, find great deals nearby.',
    },
    {
      icon: 'bi-credit-card',
      title: 'Subscription Payments',
      description: 'Manage all your subscriptions in one dashboard. Never miss a payment with automated reminders.',
    },
  ];

  return (
    <div className="public-home">
      {/* Minimal Top Nav for Public Home */}
      <nav className="top-nav">
        <div className="container">
          <div className="nav-inner" style={{ height: 72 }}>
            <Link to="/" className="nav-brand">
              <span className="brand-mark">BL</span>
              <span>BacheLORE</span>
            </Link>

            <div className="nav-actions">
              <button
                className="theme-toggle"
                onClick={toggleTheme}
                type="button"
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                <i className={`bi ${theme === 'light' ? 'bi-moon-stars' : 'bi-sun-fill'}`} />
              </button>

              <Link to="/login" className="btn-ghost d-none d-sm-inline-flex">
                Log in
              </Link>
              <Link to="/signup" className="btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-spotlight" />

        <div className="hero-content">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="hero-badge"
          >
            <i className="bi bi-stars" style={{ color: 'var(--accent)' }} />
            End-to-end Platform
          </motion.div>

          {/* Title with word frames */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="hero-title hero-title-animated"
          >
            Bachelor Life,
            <br />
            <WordFrame>Fully</WordFrame> Orchestrated
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="hero-subtitle"
          >
            Tuition, maids, roommates, rent, marketplace, subscriptions,
            and admin monitoring — all unified in one beautiful platform.
          </motion.p>

          {/* CTA Row */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="hero-cta-row"
          >
            <Link to="/signup" className="btn-primary">
              Start Free
              <i className="bi bi-arrow-right" />
            </Link>
            <Link to="/login" className="btn-ghost">
              Sign In
            </Link>
          </motion.div>

          {/* Stepper */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Stepper />
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          style={{
            position: 'absolute',
            bottom: 32,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            color: 'var(--fg-muted)',
          }}
        >
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Scroll
          </span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <i className="bi bi-chevron-down" />
          </motion.div>
        </motion.div>
      </section>

      {/* Logo Strip */}
      <LogoStrip />

      {/* Features Section */}
      <section className="section" style={{ background: 'var(--bg-surface)' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-label">Features</span>
            <h2 className="section-title">Everything you need</h2>
            <p className="section-subtitle">
              Six powerful modules working together to simplify every aspect of bachelor life
            </p>
          </div>

          <div className="bento-grid">
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                {...feature}
                delay={index * 100}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section">
        <div className="container">
          <div
            className="surface-card"
            style={{
              background: 'linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-surface) 100%)',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 48,
                textAlign: 'center',
              }}
            >
              {[
                { value: '10K+', label: 'Active Users' },
                { value: '50+', label: 'Cities Covered' },
                { value: '99%', label: 'Satisfaction Rate' },
                { value: '24/7', label: 'Support Available' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '3rem',
                      fontWeight: 800,
                      color: 'var(--accent)',
                      marginBottom: 8,
                    }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-label">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section" style={{ background: 'var(--bg-primary)' }}>
        <div className="container container-narrow">
          <div className="section-header">
            <span className="section-label">FAQ</span>
            <h2 className="section-title">Common questions</h2>
          </div>

          <div className="surface-card" style={{ padding: '0 32px' }}>
            <div className="accordion">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={openFaq === index}
                  onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section">
        <div className="container">
          <div
            className="surface-card text-center"
            style={{
              background: 'var(--accent)',
              color: 'var(--bg-primary)',
              padding: '64px 48px',
            }}
          >
            <h2 style={{ color: 'inherit', marginBottom: 16 }}>
              Ready to orchestrate your bachelor life?
            </h2>
            <p style={{ color: 'inherit', opacity: 0.8, marginBottom: 32, maxWidth: 480, margin: '0 auto 32px' }}>
              Join thousands of users who have simplified their daily life with BacheLORE.
            </p>
            <Link
              to="/signup"
              className="btn-primary"
              style={{
                background: 'var(--bg-primary)',
                color: 'var(--accent)',
              }}
            >
              Get Started Free
              <i className="bi bi-arrow-right" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            {/* Brand Column */}
            <div>
              <div className="footer-brand">
                <span className="brand-mark">BL</span>
                <span className="footer-brand-text">BacheLORE</span>
              </div>
              <p style={{ color: 'var(--fg-muted)', marginBottom: 16, maxWidth: 280 }}>
                The complete platform for managing bachelor life. Built with care for students and young professionals.
              </p>
              <div className="status-badge">
                <span className="status-dot" />
                <span>All systems operational</span>
              </div>
            </div>

            {/* Product Links */}
            <div className="footer-column">
              <h6>Product</h6>
              <ul className="footer-links">
                {['Features', 'Pricing', 'Integrations', 'Changelog'].map((link) => (
                  <li key={link}>
                    <a href="#">{link}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Docs Links */}
            <div className="footer-column">
              <h6>Resources</h6>
              <ul className="footer-links">
                {['Documentation', 'API Reference', 'Guides', 'Support'].map((link) => (
                  <li key={link}>
                    <a href="#">{link}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Links */}
            <div className="footer-column">
              <h6>Legal</h6>
              <ul className="footer-links">
                {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((link) => (
                  <li key={link}>
                    <a href="#">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <div className="footer-copyright">
              © {new Date().getFullYear()} BacheLORE. All rights reserved.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--fg-muted)' }}>
              <span>Made with</span>
              <i className="bi bi-heart-fill" style={{ color: 'var(--danger)', fontSize: 14 }} />
              <span>for the Lore</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
