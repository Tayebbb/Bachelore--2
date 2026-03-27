import React from 'react';
import StatusBadge from '../components/StatusBadge.jsx';

const payments = [
  { id: 'pay1', amount: 499, method: 'bKash', date: '2026-03-25', status: 'completed' },
  { id: 'pay2', amount: 499, method: 'Nagad', date: '2026-02-25', status: 'completed' },
  { id: 'pay3', amount: 499, method: 'Card', date: '2026-01-25', status: 'failed' },
];

export default function SubscriptionModern() {
  return (
    <div className="grid-two">
      <section className="surface-card">
        <h5 className="mb-2">Subscription Plans</h5>
        <p className="text-secondary">Unlock premium placement, verified badge priority, and faster approvals.</p>
        <div className="d-flex gap-2 flex-wrap">
          <button className="btn-gradient">Activate Monthly (499 BDT)</button>
          <button className="btn-soft">View Invoices</button>
        </div>
      </section>

      <section className="surface-card">
        <h5 className="mb-3">Payment History</h5>
        <div className="table-responsive">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Date</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.date}</td>
                  <td>{payment.method}</td>
                  <td>{payment.amount} BDT</td>
                  <td>
                    <StatusBadge status={payment.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
