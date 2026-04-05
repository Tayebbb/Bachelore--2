import React, { useEffect, useState } from 'react';
import AppShell from '../components/AppShell.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

export default function BookedTuitions() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/booked-tuitions')
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
            <h4 style={{ marginBottom: 4 }}>Booked Tuitions</h4>
            <small style={{ color: 'var(--fg-muted)' }}>Confirmed tuition bookings.</small>
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
              <h4>No booked tuitions found</h4>
              <p>Nothing to show here yet.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table-modern">
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Title</th>
                    <th>Applicant</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.booking_id || r._id}>
                      <td>{r.booking_id || r._id}</td>
                      <td>{r.title || 'Tuition'} - {r.location || '-'}</td>
                      <td>{r.applicantName || '-'} ({r.applicantEmail || '-'})</td>
                      <td><StatusBadge status={r.status || 'booked'} /></td>
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
