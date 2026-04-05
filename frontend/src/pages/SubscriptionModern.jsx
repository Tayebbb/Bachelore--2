import React, { useState } from 'react';
import { motion } from 'framer-motion';
import AppShell from '../components/AppShell.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

const payments = [
  { id: 'pay1', amount: 499, method: 'bKash', date: '2026-03-25', status: 'completed' },
  { id: 'pay2', amount: 499, method: 'Nagad', date: '2026-02-25', status: 'completed' },
  { id: 'pay3', amount: 499, method: 'Card', date: '2026-01-25', status: 'failed' },
];

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '0',
    period: 'forever',
    description: 'Basic access to browse listings and view content.',
    features: [
      'Browse all listings',
      'View contact details',
      'Basic search filters',
    ],
    cta: 'Current Plan',
    featured: false,
  },
  {
    id: 'monthly',
    name: 'Monthly',
    price: '499',
    period: 'month',
    description: 'Full access with priority placement and verified badge.',
    features: [
      'Everything in Free',
      'Priority listing placement',
      'Verified badge',
      'Faster approvals',
      'Premium support',
    ],
    cta: 'Upgrade Now',
    featured: true,
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: '4,990',
    period: 'year',
    description: 'Best value with 2 months free and all premium features.',
    features: [
      'Everything in Monthly',
      '2 months free',
      'Bulk listing discount',
      'API access',
      'Dedicated account manager',
    ],
    cta: 'Upgrade Now',
    featured: false,
  },
];

export default function SubscriptionModern() {
  void motion;
  const [selectedPlan, setSelectedPlan] = useState('monthly');

  return (
    <AppShell>
      {/* Stats Row */}
      <section className="bento-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { label: 'Next Payment', value: 'Apr 25, 2026', sub: 'Monthly plan' },
          { label: 'Amount Due', value: '499 BDT', sub: 'Auto-renewal enabled' },
          { label: 'Total Paid', value: '1,497 BDT', sub: 'Since joining' },
          { label: 'Days Left', value: '18', sub: 'In current period' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            className="surface-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="text-label" style={{ marginBottom: 8 }}>{stat.label}</div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.75rem',
                fontWeight: 700,
                color: 'var(--fg-primary)',
                marginBottom: 4,
              }}
            >
              {stat.value}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--fg-muted)' }}>{stat.sub}</div>
          </motion.div>
        ))}
      </section>

      {/* Pricing Cards */}
      <section>
        <div className="section-header" style={{ marginBottom: 32, textAlign: 'center' }}>
          <span className="section-label">Pricing</span>
          <h2 style={{ marginTop: 8 }}>Choose your plan</h2>
          <p style={{ color: 'var(--fg-muted)', marginTop: 8 }}>
            Unlock premium features and priority access
          </p>
        </div>

        <div className="pricing-grid">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              className={`pricing-card ${plan.featured ? 'featured' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <div className="pricing-tier">{plan.name}</div>
              <div className="pricing-price">
                ৳{plan.price}
                <span>/{plan.period}</span>
              </div>
              <p style={{ color: 'var(--fg-muted)', fontSize: '0.9375rem', marginBottom: 24 }}>
                {plan.description}
              </p>

              <ul className="pricing-features">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>

              <button
                className={plan.featured ? 'btn-primary w-full' : 'btn-ghost w-full'}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.id === selectedPlan ? 'Current Plan' : plan.cta}
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Payment History */}
      <section className="surface-card">
        <div className="section-header" style={{ marginBottom: 20 }}>
          <div>
            <span className="section-label">Billing</span>
            <h3 style={{ marginTop: 8 }}>Payment History</h3>
          </div>
          <button className="btn-ghost" style={{ fontSize: '0.875rem' }}>
            <i className="bi bi-download me-2" />
            Export
          </button>
        </div>

        <div className="table-responsive">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Date</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Invoice</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.date}</td>
                  <td>{payment.method}</td>
                  <td style={{ fontWeight: 600 }}>{payment.amount} BDT</td>
                  <td>
                    <StatusBadge status={payment.status} />
                  </td>
                  <td>
                    <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: '0.875rem' }}>
                      <i className="bi bi-download" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Cancel Section */}
      <section
        className="surface-card"
        style={{
          border: '1px solid var(--border)',
          background: 'transparent',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h4 style={{ marginBottom: 4 }}>Cancel Subscription</h4>
            <p style={{ color: 'var(--fg-muted)', margin: 0 }}>
              You can cancel anytime. Your access will continue until the end of your billing period.
            </p>
          </div>
          <button
            className="btn-ghost"
            style={{
              color: 'var(--danger)',
              borderColor: 'var(--danger)',
            }}
          >
            Cancel Plan
          </button>
        </div>
      </section>
    </AppShell>
  );
}
