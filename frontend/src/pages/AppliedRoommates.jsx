import React, { useEffect, useState } from 'react';

export default function AppliedRoommates() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/roommates/applied')
      .then((r) => r.json())
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="container py-5">
      <h3>Applied Roommates</h3>
      <p className="muted">Pending roommate applications.</p>
      {loading ? <div>Loading...</div> : (
        <div className="card p-3">
          {rows.length === 0 ? <div className="muted">No roommate applications.</div> : (
            <div className="list-group">
              {rows.map((r) => (
                <div key={r.application_id || r._id} className="list-group-item">
                  <div className="fw-bold">{r.name || '-'} ({r.email || '-'})</div>
                  <div className="small muted">Location: {r.location || '-'} • Status: {r.status}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
