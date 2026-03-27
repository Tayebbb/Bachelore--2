import React from 'react';

export default function StatusBadge({ status = 'Pending' }) {
  const normalized = String(status).toLowerCase();
  let className = 'badge-status badge-pending';

  if (normalized.includes('approved') || normalized.includes('completed')) {
    className = 'badge-status badge-approved';
  } else if (normalized.includes('booked') || normalized.includes('sold')) {
    className = 'badge-status badge-booked';
  } else if (normalized.includes('reject') || normalized.includes('failed') || normalized.includes('cancel')) {
    className = 'badge-status badge-rejected';
  }

  return <span className={className}>{status}</span>;
}
