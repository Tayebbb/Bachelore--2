import React, { useEffect, useState } from 'react';

export default function BookedMaids() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/booked-maids')
      .then((r) => r.json())
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="container py-5">
      <h3>Booked Maids</h3>
      <p className="muted">Confirmed maid bookings.</p>
      {loading ? <div>Loading...</div> : (
        <div className="card p-3">
          {rows.length === 0 ? <div className="muted">No booked maids.</div> : (
            <div className="list-group">
              {rows.map((r) => (
                <div key={r.booking_id || r._id} className="list-group-item">
                  <div className="fw-bold">{r.name || 'Maid'} • {r.location || '-'}</div>
                  <div className="small muted">Booked by: {r.applicantName || '-'} ({r.applicantEmail || '-'})</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
