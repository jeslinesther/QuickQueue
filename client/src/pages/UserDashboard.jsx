import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { generateToken, getCurrentToken, getTokenHistory } from '../services/tokenService';
import StatusBadge from '../components/StatusBadge';
import NotificationBanner from '../components/NotificationBanner';

const SERVICES = [
  { id: 'General Consultation', name: 'General Consultation', desc: 'General inquiries & assistance' },
  { id: 'Account Services', name: 'Account Services', desc: 'Account updates, verification, and KYC' },
  { id: 'Technical Support', name: 'Technical Support', desc: 'Hardware, software, & network troubleshooting' },
  { id: 'Billing & Payments', name: 'Billing & Payments', desc: 'Invoices, payments, refunds, & receipts' },
];

function UserDashboard() {
  const { user } = useAuth();

  const [currentTokenData, setCurrentTokenData] = useState(null);
  const [hasActiveToken, setHasActiveToken] = useState(false);
  const [history, setHistory] = useState([]);
  const [selectedService, setSelectedService] = useState(SERVICES[0].id);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [userNotification, setUserNotification] = useState(null);

  // Fetch current token and history
  const fetchData = async () => {
    try {
      const currentRes = await getCurrentToken();
      if (currentRes.success) {
        setHasActiveToken(currentRes.hasActiveToken);
        setCurrentTokenData(currentRes.data);
        if (currentRes.data?.notification) {
          setUserNotification(currentRes.data.notification);
        }
      }

      const historyRes = await getTokenHistory();
      if (historyRes.success) {
        setHistory(historyRes.data || []);
      }
    } catch (err) {
      console.error('Error polling user queue data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and 5-second polling interval
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Handle Token Generation
  const handleGenerateToken = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    setGenerating(true);

    try {
      const res = await generateToken(selectedService);
      if (res.success) {
        setActionSuccess(res.message || 'Token generated successfully!');
        fetchData();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to generate token.';
      setActionError(msg);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Welcome Banner */}
      <div className="dashboard-header">
        <div>
          <h2>Welcome, {user?.name || 'Customer'}! 👋</h2>
          <p className="header-subtitle">Track your live queue position and predicted waiting times</p>
        </div>
        <div className="user-badge-info">
          <span>Phone: {user?.phone || 'N/A'}</span>
          <span className="dot-separator">•</span>
          <span className="live-indicator">
            <span className="pulse-dot"></span> Live Queue Sync (5s)
          </span>
        </div>
      </div>

      {/* In-app Notification Banner */}
      {userNotification && (
        <NotificationBanner
          message={userNotification}
          type={
            currentTokenData?.token?.status === 'CALLED'
              ? 'alert'
              : currentTokenData?.peopleAhead <= 1
              ? 'warning'
              : 'info'
          }
          onClose={() => setUserNotification(null)}
        />
      )}

      {actionError && <div className="alert-error mb-4">{actionError}</div>}
      {actionSuccess && <div className="alert-success mb-4">{actionSuccess}</div>}

      {/* Main Content Area */}
      <div className="dashboard-grid">
        {/* Left Column: Active Token or Generation Card */}
        <div className="dashboard-main">
          {loading ? (
            <div className="card loading-card">
              <div className="spinner"></div>
              <p>Loading queue status...</p>
            </div>
          ) : hasActiveToken && currentTokenData?.token ? (
            <div className="card active-token-card">
              <div className="card-header">
                <span className="card-title">My Active Token</span>
                <StatusBadge status={currentTokenData.token.status} />
              </div>

              <div className="token-hero">
                <div className="token-number">{currentTokenData.token.tokenNumber}</div>
                <div className="token-service">{currentTokenData.token.serviceType}</div>
              </div>

              {/* Grace Period Timer Banner if Called */}
              {currentTokenData.token.status === 'CALLED' && (
                <div className="grace-period-box">
                  <div className="grace-header">
                    <span>🚨 Proceed to Counter {currentTokenData.counter || 1}</span>
                    <span className="countdown-number">
                      {currentTokenData.secondsRemaining}s remaining
                    </span>
                  </div>
                  <div className="progress-bar-bg">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${Math.min(100, (currentTokenData.secondsRemaining / 120) * 100)}%`,
                      }}
                    ></div>
                  </div>
                  <p className="grace-hint">
                    Please present yourself at the counter. If not arrived within 2 minutes, your
                    token will be moved to the end of the queue.
                  </p>
                </div>
              )}

              {/* Live Metrics Grid */}
              <div className="metrics-grid">
                <div className="metric-box">
                  <span className="metric-label">Queue Position</span>
                  <span className="metric-value">
                    {currentTokenData.token.status === 'WAITING'
                      ? `#${currentTokenData.queuePosition}`
                      : '—'}
                  </span>
                </div>

                <div className="metric-box">
                  <span className="metric-label">People Ahead</span>
                  <span className="metric-value">
                    {currentTokenData.token.status === 'WAITING'
                      ? currentTokenData.peopleAhead
                      : 0}
                  </span>
                </div>

                <div className="metric-box">
                  <span className="metric-label">Serving Counter</span>
                  <span className="metric-value">
                    {currentTokenData.counter ? `Counter ${currentTokenData.counter}` : 'Pending'}
                  </span>
                </div>

                <div className="metric-box highlight-metric">
                  <span className="metric-label">AI Predicted Wait</span>
                  <span className="metric-value text-accent">
                    {currentTokenData.token.status === 'WAITING'
                      ? `~${currentTokenData.token.predictedWaitTime || 5} mins`
                      : currentTokenData.token.status === 'CALLED'
                      ? 'Called'
                      : 'In Service'}
                  </span>
                </div>
              </div>

              <div className="token-details-footer">
                <div>
                  <small>Currently Serving in Queue: </small>
                  <strong>{currentTokenData.currentServingToken}</strong>
                </div>
                {currentTokenData.token.missedCount > 0 && (
                  <div className="missed-warning">
                    ⚠️ Missed Calls: {currentTokenData.token.missedCount}/2
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card generate-token-card">
              <div className="card-header">
                <span className="card-title">Generate a Queue Token</span>
                <span className="pill-badge">Quick & Smart</span>
              </div>

              <p className="generate-desc">
                Select your required service to enter the smart queue. You will receive an instant
                token number and an AI-calculated estimated waiting time.
              </p>

              <form onSubmit={handleGenerateToken} className="generate-form">
                <div className="services-selector">
                  {SERVICES.map((srv) => (
                    <label
                      key={srv.id}
                      className={`service-option ${selectedService === srv.id ? 'selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="serviceType"
                        value={srv.id}
                        checked={selectedService === srv.id}
                        onChange={(e) => setSelectedService(e.target.value)}
                      />
                      <div className="service-info">
                        <span className="service-name">{srv.name}</span>
                        <span className="service-desc">{srv.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-block btn-lg mt-4"
                  disabled={generating}
                >
                  {generating ? 'Generating Token...' : '🎫 Generate Queue Token'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Column: Token History */}
        <div className="dashboard-sidebar">
          <div className="card history-card">
            <div className="card-header">
              <span className="card-title">My Token History</span>
              <span className="count-pill">{history.length}</span>
            </div>

            {history.length === 0 ? (
              <div className="empty-state">
                <p>No past tokens found.</p>
              </div>
            ) : (
              <div className="history-list">
                {history.map((item) => (
                  <div key={item._id} className="history-item">
                    <div className="history-top">
                      <span className="history-token-number">{item.tokenNumber}</span>
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="history-sub">
                      <span>{item.serviceType}</span>
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                    {item.completedAt && (
                      <div className="history-footer">
                        <span>
                          Time: {new Date(item.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;
