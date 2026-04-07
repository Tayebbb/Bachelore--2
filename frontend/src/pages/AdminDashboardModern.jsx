import React, { useEffect, useMemo, useState } from 'react';
import AppShell from '../components/AppShell.jsx';
import api from '../components/axios.jsx';

export default function AdminDashboardModern() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [confirmModal, setConfirmModal] = useState(false);
  const [target, setTarget] = useState(null);
  const [overview, setOverview] = useState(null);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, usersRes] = await Promise.all([
          api.get('/api/dashboard/stats'),
          api.get('/api/users'),
        ]);

        setOverview(statsRes.data?.overview || null);
        const users = Array.isArray(usersRes.data) ? usersRes.data : [];
        setRows(users.map((u) => ({
          id: u._id || u.user_id,
          name: u.name || 'Unknown',
          email: u.email || '-',
          role: u.role || 'user',
          status: 'Active',
        })));
      } catch {
        setOverview(null);
        setRows([]);
      }
    };

    load();
  }, []);

  const metrics = [
    { key: 'users', label: 'User Count', value: Number(rows.length).toLocaleString(), trend: 'Live', trendType: 'success' },
    { key: 'reports', label: 'Pending Applications', value: Number(overview?.pendingApplications ?? 0).toLocaleString(), trend: 'Live', trendType: 'danger' },
    { key: 'revenue', label: 'Total Revenue', value: Number(overview?.totalPayments ?? 0).toLocaleString(), trend: 'Live', trendType: 'success' },
    { key: 'listings', label: 'Active Listings', value: Number(overview?.activeMarketplaceItems ?? 0).toLocaleString(), trend: 'Live', trendType: 'success' },
  ];

  const roles = ['All', ...Array.from(new Set(rows.map((r) => String(r.role || '').toLowerCase()))).map((r) => r.charAt(0).toUpperCase() + r.slice(1))];

  const filteredRows = useMemo(() => {
    if (activeFilter === 'All') return rows;
    return rows.filter((r) => String(r.role || '').toLowerCase() === activeFilter.toLowerCase());
  }, [activeFilter, rows]);

  const handleBan = () => {
    setConfirmModal(false);
    setTarget(null);
  };

  return (
    <AppShell>
      <section className="bento-grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
        {metrics.map((metric) => (
          <article key={metric.key} className="surface-card reveal-on-scroll">
            <div className="text-label" style={{ marginBottom: 8 }}>{metric.label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700 }}>{metric.value}</div>
            <div style={{ color: metric.trendType === 'success' ? 'var(--success)' : 'var(--danger)', fontWeight: 600, marginTop: 6 }}>
              {metric.trend}
            </div>
          </article>
        ))}
      </section>

      <section className="surface-card">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {roles.map((filter) => (
            <button
              key={filter}
              style={{
                padding: '8px 20px',
                borderRadius: 999,
                border: activeFilter === filter ? 'none' : '1px solid var(--border)',
                background: activeFilter === filter ? 'var(--accent)' : 'var(--bg-elevated)',
                color: activeFilter === filter ? 'var(--bg-primary)' : 'var(--fg-muted)',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onClick={() => setActiveFilter(filter)}
              type="button"
            >
              {filter}
            </button>
          ))}
        </div>
      </section>

      <section className="surface-card">
        <div className="table-responsive">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.email}</td>
                  <td>{row.role}</td>
                  <td>{row.status}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: '0.875rem' }} type="button">View</button>
                      <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.875rem' }} type="button">Approve</button>
                      <button
                        className="btn-primary"
                        style={{ background: 'var(--danger)', border: 'none', padding: '6px 12px', fontSize: '0.875rem' }}
                        onClick={() => {
                          setTarget(row);
                          setConfirmModal(true);
                        }}
                        type="button"
                      >
                        <i className="bi bi-slash-circle me-2" />
                        Ban
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--fg-muted)' }}>No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {confirmModal && (
        <div className="modal-overlay" onClick={() => setConfirmModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5 className="modal-title"><i className="bi bi-shield-exclamation me-2" />Confirm Action</h5>
            </div>
            <p style={{ color: 'var(--fg-muted)' }}>
              You are about to ban {target?.name || 'this user'}. This action may restrict account access immediately.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
              <button className="btn-ghost" type="button" onClick={() => setConfirmModal(false)}>Cancel</button>
              <button className="btn-primary" style={{ background: 'var(--danger)' }} type="button" onClick={handleBan}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
