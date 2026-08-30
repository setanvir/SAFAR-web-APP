import React from 'react';

/**
 * Reusable Status Pill Badge for Bookings, Packages, Agencies, and Users.
 */
export default function StatusBadge({ status, type }) {
  const normalized = (status || '').toLowerCase();

  let badgeClass = 'badge-pending';
  let label = status;

  if (['approved', 'verified', 'active', 'completed'].includes(normalized)) {
    badgeClass = 'badge-approved';
  } else if (['rejected', 'cancelled', 'failed', 'suspended', 'archived'].includes(normalized)) {
    badgeClass = 'badge-rejected';
  } else if (type === 'tour') {
    badgeClass = 'badge-approved';
  } else if (type === 'hotel') {
    badgeClass = 'badge-pending';
  }

  return (
    <span className={`badge ${badgeClass}`} style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      {label}
    </span>
  );
}
