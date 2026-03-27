import React, { useEffect, useState } from 'react';

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
    <main className="container py-5">
      <h3>Applied Tuitions</h3>
      <p className="muted">Track tuition applications and their statuses.</p>
      {loading ? <div>Loading...</div> : (
        <div className="card p-3">
          {rows.length === 0 ? <div className="muted">No applied tuition records.</div> : (
            <div className="table-responsive">
              <table className="table table-sm align-middle">
                <thead>
                  <tr>
                    <th>Application ID</th>
                    <th>Applicant</th>
                    <th>Status</th>
                    <th>Applied At</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.application_id || r._id}>
                      <td>{r.application_id || r._id}</td>
                      <td>{r.name || '-'} ({r.email || '-'})</td>
                      <td>{r.status}</td>
                      <td>{r.applied_at ? new Date(r.applied_at).toLocaleString() : '-'}</td>
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
