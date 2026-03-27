import React, { useEffect, useState } from 'react';
import { getUser } from '../lib/auth';

export default function UserActivities() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = getUser();

  useEffect(() => {
    const uid = user?.id || user?._id;
    const url = uid ? `/api/activity?userId=${uid}` : '/api/activity';

    fetch(url)
      .then((r) => r.json())
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [user?.id, user?._id]);

  return (
    <main className="container py-5">
      <h3>User Activities</h3>
      <p className="muted">Action logs from UserActivities.</p>
      {loading ? <div>Loading...</div> : (
        <div className="card p-3">
          {rows.length === 0 ? <div className="muted">No activities found.</div> : (
            <div className="table-responsive">
              <table className="table table-sm align-middle">
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
                      <td>{r.action_type}</td>
                      <td>{r.reference_table}</td>
                      <td>{r.reference_id || '-'}</td>
                      <td>{r.timestamp ? new Date(r.timestamp).toLocaleString() : '-'}</td>
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
