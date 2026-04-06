import React, { useEffect, useState } from 'react';
import api from '../../components/axios.jsx';
import { getUser } from '../../lib/auth';

export default function StudentDashboardPage() {
  const [overview, setOverview] = useState(null);
  const [requestStatuses, setRequestStatuses] = useState([]);
  const [error, setError] = useState(null);
  const user = getUser();

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/api/student/dashboard');
        setOverview(data?.overview || null);
        setRequestStatuses(Array.isArray(data?.requestStatuses) ? data.requestStatuses : []);
        setError(null);
      } catch (err) {
        console.error('Dashboard load error:', err);
        setOverview(null);
        setRequestStatuses([]);
        if (err.response?.status === 403) {
          setError('Access Denied: You do not have permission to view the student dashboard.');
        } else {
          setError('Failed to load dashboard data. Please try again later.');
        }
      }
    };
    load();
  }, []);

  const cards = [
    { label: 'Applications', value: overview?.total_applications ?? 0 },
    { label: 'Pending Requests', value: requestStatuses.filter((r) => String(r.status || '').toLowerCase() === 'pending').length },
    { label: 'Bookings', value: overview?.total_bookings ?? 0 },
    { label: 'Listings', value: overview?.total_listings ?? 0 },
    { label: 'Payments', value: overview?.total_payments ?? 0 },
  ];

  const pending = requestStatuses.filter(r => String(r.status || '').toLowerCase() === 'pending');
  const approved = requestStatuses.filter(r => String(r.status || '').toLowerCase() === 'approved');

  return (
    <div className="panel-page">
      <header className="panel-page-header">
        <h2 className="panel-page-title">Welcome, {user?.name || 'Student'}</h2>
        <p className="panel-page-subtitle">Here is your activity and progress overview.</p>
      </header>

      {error ? (
        <div className="panel-empty-state" style={{ padding: '40px', textAlign: 'center', opacity: 0.8 }}>
          <i className="bi bi-exclamation-octagon" style={{ fontSize: '2rem', color: 'var(--danger)', marginBottom: '1rem', display: 'block' }} />
          <p>{error}</p>
          <button className="btn-primary" onClick={() => window.location.reload()} style={{ marginTop: '16px' }}>
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="panel-grid-cards">
            {cards.map((card) => (
              <div className="panel-metric-card" key={card.label}>
                <div className="panel-metric-label">{card.label}</div>
                <div className="panel-metric-value">{Number(card.value).toLocaleString()}</div>
              </div>
            ))}
          </div>

          <div className="panel-block" style={{ marginTop: 20 }}>
            <h5 className="panel-block-title">Pending Requests</h5>
            <div className="panel-table-wrap">
              <table className="table-modern">
                <thead>
                  <tr>
                    <th>Module</th>
                    <th>Listing</th>
                    <th>Status</th>
                    <th>Applied At</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((row) => (
                    <tr key={`${row.module}-${row.application_id}`}>
                      <td>{row.module}</td>
                      <td>{row.listing_title}</td>
                      <td>{row.status}</td>
                      <td>{row.applied_at ? new Date(row.applied_at).toLocaleString() : '-'}</td>
                    </tr>
                  ))}
                  {pending.length === 0 && (
                    <tr>
                      <td colSpan={4} className="panel-empty">No pending requests.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel-block" style={{ marginTop: 20 }}>
            <h5 className="panel-block-title">Approved Requests</h5>
            <div className="panel-table-wrap">
              <table className="table-modern">
                <thead>
                  <tr>
                    <th>Module</th>
                    <th>Listing</th>
                    <th>Status</th>
                    <th>Applied At</th>
                  </tr>
                </thead>
                <tbody>
                  {approved.map((row) => (
                    <tr key={`${row.module}-${row.application_id}`}>
                      <td>{row.module}</td>
                      <td>{row.listing_title}</td>
                      <td>{row.status}</td>
                      <td>{row.applied_at ? new Date(row.applied_at).toLocaleString() : '-'}</td>
                    </tr>
                  ))}
                  {approved.length === 0 && (
                    <tr>
                      <td colSpan={4} className="panel-empty">No approved requests.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
