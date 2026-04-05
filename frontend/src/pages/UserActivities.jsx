import React, { useEffect, useState } from 'react';
import { getUser } from '../lib/auth';
import api from '../components/axios.jsx';

export default function UserActivities() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = getUser();

  useEffect(() => {
    const uid = user?.id || user?._id;
    api.get('/api/activity', { params: uid ? { userId: uid } : {} })
      .then(({ data }) => setRows(Array.isArray(data) ? data : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [user?.id, user?._id]);

  return (
    <main className="container" style={{ paddingTop: '120px', paddingBottom: '80px' }}>
      <div className="mb-6">
        <h1 className="section-title text-left">User Activities</h1>
        <p className="section-subtitle text-left" style={{ margin: 0 }}>
          Action logs and event history from the UserActivities system.
        </p>
      </div>

      {loading ? (
        <div className="surface-card text-center p-6">
          <div className="text-muted">Loading activities...</div>
        </div>
      ) : (
        <div className="surface-card p-0" style={{ overflow: 'hidden' }}>
          {rows.length === 0 ? (
            <div className="p-6 text-center text-muted">No activities found.</div>
          ) : (
            <div className="table-responsive">
              <table className="table-modern">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Table</th>
                    <th>Reference</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.activity_id || r._id}>
                      <td style={{ fontWeight: 600, color: 'var(--accent)' }}>
                        {r.action_type}
                      </td>
                      <td>{r.reference_table}</td>
                      <td className="text-mono" style={{ fontSize: '0.8rem' }}>
                        {r.reference_id || '-'}
                      </td>
                      <td style={{ fontSize: '0.875rem', color: 'var(--fg-muted)', opacity: 0.9 }}>
                        {r.timestamp ? new Date(r.timestamp).toLocaleString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
