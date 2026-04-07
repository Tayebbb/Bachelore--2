import React from 'react';

const statusMap = {
  approved: 'badge-approved',
  booked: 'badge-booked',
  active: 'badge-approved',
  available: 'badge-approved',
  success: 'badge-approved',
  service: 'badge-approved',
  pending: 'badge-pending',
  processing: 'badge-pending',
  system: 'badge-pending',
  pricing: 'badge-pending',
  rejected: 'badge-rejected',
  cancelled: 'badge-rejected',
  failed: 'badge-failed',
  sold: 'badge-rejected',
  inactive: 'badge-pending',
};

const statusIcons = {
  approved: 'bi-check-circle',
  booked: 'bi-calendar-check',
  active: 'bi-circle-fill',
  pending: 'bi-clock',
  rejected: 'bi-x-circle',
  failed: 'bi-exclamation-circle',
  sold: 'bi-tag',
};

export default function StatusBadge({ status, showIcon = true }) {
  const key = status?.toLowerCase().replace(/\s+/g, '_');
  const cls = statusMap[key] || statusMap[status?.toLowerCase()] || 'badge-pending';
  const icon = statusIcons[key] || statusIcons[status?.toLowerCase()];

  return (
    <span className={`badge-status ${cls}`}>
      {showIcon && icon && (
        <i className={`bi ${icon}`} style={{ fontSize: '0.65rem' }} />
      )}
      {status}
    </span>
  );
}
