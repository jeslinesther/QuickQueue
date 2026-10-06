import React from 'react';

function StatusBadge({ status }) {
  const getBadgeClass = (st) => {
    switch (st) {
      case 'WAITING':
        return 'badge-waiting';
      case 'CALLED':
        return 'badge-called';
      case 'IN_SERVICE':
        return 'badge-in-service';
      case 'COMPLETED':
        return 'badge-completed';
      case 'MISSED':
        return 'badge-missed';
      case 'EXPIRED':
        return 'badge-expired';
      default:
        return 'badge-default';
    }
  };

  const getStatusLabel = (st) => {
    switch (st) {
      case 'WAITING':
        return '⏳ In Queue';
      case 'CALLED':
        return '🔔 Called';
      case 'IN_SERVICE':
        return '⚡ Serving Now';
      case 'COMPLETED':
        return '✅ Completed';
      case 'MISSED':
        return '⚠️ Missed (Requeued)';
      case 'EXPIRED':
        return '❌ Expired';
      default:
        return st;
    }
  };

  return (
    <span className={`status-badge ${getBadgeClass(status)}`}>
      {getStatusLabel(status)}
    </span>
  );
}

export default StatusBadge;
