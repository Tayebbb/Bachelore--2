import React, { useEffect, useState } from 'react';
import api from '../../components/axios.jsx';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/api/admin/payments');
        setPayments(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        console.error('Failed to load payments:', err);
        setPayments([]);
        setError('Failed to load payment data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalAmount = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const verifiedCount = payments.filter(p => p.status === 'paid').length;
  const pendingCount = payments.filter(p => p.status === 'pending').length;

  const formatStatus = (status) => {
    const statusStyles = {
      'paid': { bg: '#d4edda', color: '#155724', text: 'Verified' },
      'pending': { bg: '#fff3cd', color: '#856404', text: 'Pending' },
      'failed': { bg: '#f8d7da', color: '#721c24', text: 'Failed' },
      'refunded': { bg: '#e7d4f5', color: '#553399', text: 'Refunded' }
    };
    const style = statusStyles[status] || { bg: '#f0f0f0', color: '#333', text: status };
    return (
      <span style={{
        backgroundColor: style.bg,
        color: style.color,
        padding: '6px 12px',
        borderRadius: '4px',
        fontWeight: 600,
        fontSize: '0.9em'
      }}>
        {style.text}
      </span>
    );
  };

  return (
    <div className="panel-page">
      <header className="panel-page-header">
        <h2 className="panel-page-title">Payment Management</h2>
        <p className="panel-page-subtitle">Track all subscription payments and verify user transactions.</p>
      </header>

      {/* Summary Cards */}
      <div className="panel-grid-cards">
        <div className="panel-metric-card">
          <div className="panel-metric-label">Total Revenue</div>
          <div className="panel-metric-value">৳ {totalAmount.toLocaleString()}</div>
        </div>
        <div className="panel-metric-card">
          <div className="panel-metric-label">Verified Payments</div>
          <div className="panel-metric-value">{verifiedCount}</div>
        </div>
        <div className="panel-metric-card">
          <div className="panel-metric-label">Pending Payments</div>
          <div className="panel-metric-value">{pendingCount}</div>
        </div>
        <div className="panel-metric-card">
          <div className="panel-metric-label">Total Transactions</div>
          <div className="panel-metric-value">{payments.length}</div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="panel-block">
        <h5 className="panel-block-title">All Payments</h5>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            <p>Loading payment data...</p>
          </div>
        ) : error ? (
          <div style={{
            padding: '20px',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '6px',
            color: '#721c24'
          }}>
            {error}
          </div>
        ) : (
          <div className="panel-table-wrap">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>User</th>
                  <th>Email</th>
                  <th>BKash Number</th>
                  <th>Reference</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="panel-empty">No payments found.</td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment.payment_id}>
                      <td><strong>#{payment.payment_id}</strong></td>
                      <td>{payment.name || 'N/A'}</td>
                      <td>{payment.email || 'N/A'}</td>
                      <td>
                        <code style={{
                          backgroundColor: '#f5f5f5',
                          padding: '4px 8px',
                          borderRadius: '3px',
                          fontSize: '0.85em'
                        }}>
                          {payment.bkash_number || payment.payment_ref || '-'}
                        </code>
                      </td>
                      <td>
                        <code style={{
                          backgroundColor: '#f5f5f5',
                          padding: '4px 8px',
                          borderRadius: '3px',
                          fontSize: '0.85em'
                        }}>
                          {payment.transaction_reference || '-'}
                        </code>
                      </td>
                      <td><strong>৳ {Number(payment.amount || 0).toLocaleString()}</strong></td>
                      <td>{formatStatus(payment.status)}</td>
                      <td>{payment.payment_date ? new Date(payment.payment_date).toLocaleString() : 'N/A'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
