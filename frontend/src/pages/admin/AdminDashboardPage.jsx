import React, { useEffect, useState } from 'react';
import api from '../../components/axios.jsx';

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState(null);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [overviewRes, paymentRes] = await Promise.all([
          api.get('/api/admin/dashboard'),
          api.get('/api/admin/payments'),
        ]);
        setOverview(overviewRes.data?.overview || null);
        setPayments(Array.isArray(paymentRes.data) ? paymentRes.data.slice(0, 8) : []);
      } catch {
        setOverview(null);
        setPayments([]);
      }
    };
    load();
  }, []);

  const cards = [
    { key: 'users', label: 'Total Users', value: overview?.total_users ?? 0 },
    { key: 'listings', label: 'Total Listings', value: overview?.total_listings ?? 0 },
    { key: 'bookings', label: 'Total Bookings', value: overview?.total_bookings ?? 0 },
    { key: 'revenue', label: 'Revenue', value: overview?.total_revenue ?? 0 },
  ];

  return (
    <div className="panel-page">
      <header className="panel-page-header">
        <h2 className="panel-page-title">Admin Dashboard</h2>
        <p className="panel-page-subtitle">Global overview from SQL aggregates and dashboard view.</p>
      </header>

      <div className="panel-grid-cards">
        {cards.map((card) => (
          <div className="panel-metric-card" key={card.key}>
            <div className="panel-metric-label">{card.label}</div>
            <div className="panel-metric-value">{Number(card.value).toLocaleString()}</div>
          </div>
        ))}
      </div>

      <div className="panel-block">
        <h5 className="panel-block-title">Recent Payments</h5>
          <div className="panel-table-wrap">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((row) => (
                  <tr key={row.payment_id}>
                    <td>{row.name || row.email || 'Unknown'}</td>
                    <td>{Number(row.amount || 0).toLocaleString()}</td>
                    <td>{row.status}</td>
                    <td>{new Date(row.payment_date).toLocaleString()}</td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={4} className="panel-empty">No payment data found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
      </div>
    </div>
  );
}
