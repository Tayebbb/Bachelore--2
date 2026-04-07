import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import AppShell from '../components/AppShell.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import api from '../components/axios.jsx';
import { getUser } from '../lib/auth';

export default function SubscriptionModern() {
  void motion;
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [amount, setAmount] = useState('99');

  const user = getUser();
  const userId = user?.id || user?._id;

  const loadPayments = useCallback(async () => {
    if (!userId) {
      setPayments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data } = await api.get(`/api/subscription/payments/${userId}`);
      setPayments(Array.isArray(data) ? data : []);
      setError('');
    } catch {
      setPayments([]);
      setError('Failed to load payment history.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const summary = useMemo(() => {
    const paid = payments.filter((p) => String(p.status || '').toLowerCase() === 'paid');
    const totalPaid = paid.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const lastPayment = payments[0]?.payment_date || payments[0]?.created_at || null;
    return {
      totalPayments: payments.length,
      totalPaid,
      lastPayment,
      latestStatus: payments[0]?.status || 'none',
    };
  }, [payments]);

  const createPayment = async () => {
    if (!userId) {
      setError('Please log in first.');
      return;
    }
    try {
      await api.post('/api/subscription', { userId, amount: Number(amount || 0), status: 'paid' });
      await loadPayments();
    } catch {
      setError('Failed to create payment.');
    }
  };

  return (
    <AppShell>
      {/* Stats Row */}
      <section className="bento-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { label: 'Last Payment', value: summary.lastPayment ? new Date(summary.lastPayment).toLocaleDateString() : '-', sub: 'From database' },
          { label: 'Latest Status', value: String(summary.latestStatus).toUpperCase(), sub: 'Most recent transaction' },
          { label: 'Total Paid', value: `${summary.totalPaid.toLocaleString()} BDT`, sub: 'From paid transactions' },
          { label: 'Transactions', value: summary.totalPayments.toLocaleString(), sub: 'All records' },
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

      <section className="surface-card">
        <div className="section-header" style={{ marginBottom: 20 }}>
          <div>
            <span className="section-label">Create Payment</span>
            <h3 style={{ marginTop: 8 }}>Add Subscription Payment</h3>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
          <input className="app-input" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount (BDT)" />
          <button className="btn-primary" type="button" onClick={createPayment}>Pay</button>
        </div>
        {error && <div style={{ color: 'var(--danger)', marginTop: 10 }}>{error}</div>}
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
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--fg-muted)' }}>Loading payments...</td></tr>
              ) : payments.map((payment) => (
                <tr key={payment._id || payment.payment_id}>
                  <td>{new Date(payment.payment_date || payment.created_at).toLocaleDateString()}</td>
                  <td>{payment.method || '-'}</td>
                  <td style={{ fontWeight: 600 }}>{payment.amount} BDT</td>
                  <td>
                    <StatusBadge status={payment.status || 'pending'} />
                  </td>
                  <td>
                    <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: '0.875rem' }}>
                      <i className="bi bi-download" />
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && payments.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--fg-muted)' }}>No payment history found.</td></tr>
              )}
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
