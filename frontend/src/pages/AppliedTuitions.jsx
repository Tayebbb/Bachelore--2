import React, { useEffect, useState } from 'react';
import AppShell from '../components/AppShell.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

export default function AppliedTuitions() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/applied-tuitions')
      .then((r) => r.json())
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="surface-card">
        <div className="page-header">
          <div>
            <h4 style={{ marginBottom: 4 }}>Applied Tuitions</h4>
            <small style={{ color: 'var(--fg-muted)' }}>Track tuition applications and their statuses.</small>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <input className="app-input" placeholder="Search..." style={{ width: 220 }} />
          </div>
        </div>
      </div>

      {loading ? <div>Loading...</div> : (
        <div className="surface-card">
          {rows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--fg-muted)' }}>
              <i className="bi bi-inbox" style={{ fontSize: '3rem', marginBottom: 16, display: 'block' }} />
              <h4>No applied tuitions found</h4>
              <p>Nothing to show here yet.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table-modern">
                <thead>
                  <tr>
                    <th>Application ID</th>
                    <th>Applicant</th>
                    <th>Status</th>
                    <th>Applied At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.application_id || r._id}>
                      <td>{r.application_id || r._id}</td>
                      <td>{r.name || '-'} ({r.email || '-'})</td>
                      <td><StatusBadge status={r.status || 'pending'} /></td>
                      <td>{r.applied_at ? new Date(r.applied_at).toLocaleString() : '-'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn-ghost" type="button">View</button>
                          <button className="btn-primary" type="button">Details</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
