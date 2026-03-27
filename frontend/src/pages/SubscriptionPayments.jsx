import React, { useEffect, useState } from 'react';
import { getUser } from '../lib/auth';

export default function SubscriptionPayments() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = getUser();

  useEffect(() => {
    if (!user?.id && !user?._id) {
      setRows([]);
      setLoading(false);
      return;
    }

    fetch(`/api/subscription/payments/${user.id || user._id}`)
      .then((r) => r.json())
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [user?.id, user?._id]);

  return (
    <main className="container py-5">
      <h3>Subscription Payments</h3>
      <p className="muted">Your payment history from SubscriptionPayments.</p>
      {loading ? <div>Loading...</div> : (
        <div className="card p-3">
          {rows.length === 0 ? <div className="muted">No payment records found.</div> : (
            <div className="table-responsive">
              <table className="table table-sm align-middle">
                <thead>
                  <tr>
                    <th>Payment ID</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.payment_id || r._id}>
                      <td>{r.payment_id || r._id}</td>
                      <td>{r.amount}</td>
                      <td>{r.status}</td>
                      <td>{r.payment_date ? new Date(r.payment_date).toLocaleString() : '-'}</td>
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
