import React from 'react';

function NotificationBanner({ message, type = 'info', onClose }) {
  if (!message) return null;

  return (
    <div className={`notification-banner banner-${type}`}>
      <div className="banner-content">
        <span className="banner-icon">
          {type === 'alert' ? '🚨' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : '📢'}
        </span>
        <span className="banner-text">{message}</span>
      </div>
      {onClose && (
        <button className="banner-close-btn" onClick={onClose} aria-label="Close notification">
          &times;
        </button>
      )}
    </div>
  );
}

export default NotificationBanner;
