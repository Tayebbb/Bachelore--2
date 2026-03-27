import React from 'react';
import StatusBadge from '../components/StatusBadge.jsx';

const rows = [
  { id: 'b1', purpose: 'Subscription', amount: '499 BDT', date: '2026-03-25', status: 'completed' },
  { id: 'b2', purpose: 'Marketplace Hold', amount: '1200 BDT', date: '2026-03-17', status: 'pending' },
  { id: 'b3', purpose: 'Refund', amount: '700 BDT', date: '2026-03-11', status: 'failed' },
];

export default function BillsModern() {
  return (
    <section className="surface-card">
      <h5 className="mb-3">Billing Ledger</h5>
      <div className="table-responsive">
        <table className="table-modern">
          <thead>
            <tr>
              <th>Purpose</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.purpose}</td>
                <td>{row.amount}</td>
                <td>{row.date}</td>
                <td>
                  <StatusBadge status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
