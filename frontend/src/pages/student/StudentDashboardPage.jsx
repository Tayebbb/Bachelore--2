import React, { useEffect, useState } from 'react';
import api from '../../components/axios.jsx';

export default function StudentDashboardPage() {
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/api/student/dashboard');
        setOverview(data?.overview || null);
      } catch {
        setOverview(null);
      }
    };
    load();
  }, []);

  const cards = [
    { label: 'Applications', value: overview?.total_applications ?? 0 },
    { label: 'Bookings', value: overview?.total_bookings ?? 0 },
    { label: 'Listings', value: overview?.total_listings ?? 0 },
    { label: 'Payments', value: overview?.total_payments ?? 0 },
  ];

  return (
    <div className="panel-page">
      <header className="panel-page-header">
        <h2 className="panel-page-title">Student Dashboard</h2>
        <p className="panel-page-subtitle">Personal activity and progress from your own database records.</p>
      </header>

      <div className="panel-grid-cards">
        {cards.map((card) => (
          <div className="panel-metric-card" key={card.label}>
            <div className="panel-metric-label">{card.label}</div>
            <div className="panel-metric-value">{Number(card.value).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
