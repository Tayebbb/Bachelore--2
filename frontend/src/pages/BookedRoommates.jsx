import React, { useEffect, useState } from 'react';

export default function BookedRoommates() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/roommates/booked')
      .then((r) => r.json())
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="container py-5">
      <h3>Booked Roommates</h3>
      <p className="muted">Confirmed roommate pairings.</p>
      {loading ? <div>Loading...</div> : (
        <div className="card p-3">
          {rows.length === 0 ? <div className="muted">No booked roommates.</div> : (
            <div className="list-group">
              {rows.map((r) => (
                <div key={r.booking_id || r._id} className="list-group-item">
                  <div className="fw-bold">Host: {r.hostName || '-'} • Applicant: {r.applicantName || '-'}</div>
                  <div className="small muted">Location: {r.location || '-'} • Confirmed: {r.confirmed_at ? new Date(r.confirmed_at).toLocaleString() : '-'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
