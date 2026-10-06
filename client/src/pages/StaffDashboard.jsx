import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getLiveQueue,
  callNextToken,
  markCustomerArrived,
  startService,
  completeService,
  markMissed,
} from '../services/queueService';
import StatusBadge from '../components/StatusBadge';

function StaffDashboard() {
  const { user } = useAuth();
  const counterNumber = user?.counterNumber || 1;

  const [queueData, setQueueData] = useState({
    waitingQueue: [],
    calledTokens: [],
    inServiceTokens: [],
    recentHistory: [],
    stats: { waitingCount: 0, calledCount: 0, inServiceCount: 0 },
  });

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch live queue data
  const fetchQueue = async () => {
    try {
      const res = await getLiveQueue();
      if (res.success) {
        setQueueData(res.data);
      }
    } catch (err) {
      console.error('Error fetching live queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  // Find token currently assigned to this counter
  const myActiveToken =
    queueData.inServiceTokens.find((t) => t.counter === counterNumber) ||
    queueData.calledTokens.find((t) => t.counter === counterNumber);

  // Actions
  const handleCallNext = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setActionLoading(true);
    try {
      const res = await callNextToken();
      if (res.success) {
        setSuccessMsg(res.message);
        fetchQueue();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to call next token.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleArrived = async (tokenId) => {
    setErrorMsg('');
    setSuccessMsg('');
    setActionLoading(true);
    try {
      const res = await markCustomerArrived(tokenId);
      if (res.success) {
        setSuccessMsg(res.message);
        fetchQueue();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to mark arrival.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartService = async (tokenId) => {
    setErrorMsg('');
    setSuccessMsg('');
    setActionLoading(true);
    try {
      const res = await startService(tokenId);
      if (res.success) {
        setSuccessMsg(res.message);
        fetchQueue();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to start service.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async (tokenId) => {
    setErrorMsg('');
    setSuccessMsg('');
    setActionLoading(true);
    try {
      const res = await completeService(tokenId);
      if (res.success) {
        setSuccessMsg(res.message);
        fetchQueue();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to complete service.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMissed = async (tokenId) => {
    setErrorMsg('');
    setSuccessMsg('');
    setActionLoading(true);
    try {
      const res = await markMissed(tokenId);
      if (res.success) {
        setSuccessMsg(res.message);
        fetchQueue();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to mark missed.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="dashboard-layout staff-layout">
      {/* Staff Header */}
      <div className="dashboard-header staff-header-bar">
        <div>
          <h2>Staff Counter Dashboard 🛡️</h2>
          <p className="header-subtitle">
            Logged in as <strong>{user?.name}</strong> • Assigned to{' '}
            <span className="counter-pill">Counter #{counterNumber}</span>
          </p>
        </div>
        <div className="live-indicator">
          <span className="pulse-dot"></span> Live Queue Sync (5s)
        </div>
      </div>

      {/* Messages */}
      {errorMsg && <div className="alert-error mb-4">{errorMsg}</div>}
      {successMsg && <div className="alert-success mb-4">{successMsg}</div>}

      {/* Overview Metric Cards */}
      <div className="queue-stats-row">
        <div className="stat-card">
          <div className="stat-value">{queueData.stats?.waitingCount || 0}</div>
          <div className="stat-label">Waiting in Queue</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{queueData.stats?.calledCount || 0}</div>
          <div className="stat-label">Called (Grace Period)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{queueData.stats?.inServiceCount || 0}</div>
          <div className="stat-label">Currently In Service</div>
        </div>
      </div>

      {/* Main Staff Grid */}
      <div className="dashboard-grid">
        {/* Left Column: Current Counter Operations */}
        <div className="dashboard-main">
          <div className="card counter-operation-card">
            <div className="card-header">
              <span className="card-title">Counter #{counterNumber} Active Serving Window</span>
              {myActiveToken && <StatusBadge status={myActiveToken.status} />}
            </div>

            {myActiveToken ? (
              <div className="current-serving-box">
                <div className="token-hero">
                  <div className="token-number">{myActiveToken.tokenNumber}</div>
                  <div className="token-service">{myActiveToken.serviceType}</div>
                  <div className="customer-meta">
                    Customer: <strong>{myActiveToken.user?.name || 'Customer'}</strong> (
                    {myActiveToken.user?.phone || 'No phone'})
                  </div>
                </div>

                {/* 2-Minute Grace Period Timer if Called */}
                {myActiveToken.status === 'CALLED' && (
                  <div className="grace-period-box">
                    <div className="grace-header">
                      <span>⏱️ 2-Minute Grace Period Window</span>
                      <span className="countdown-number">
                        {myActiveToken.secondsRemaining || 0}s remaining
                      </span>
                    </div>
                    <div className="progress-bar-bg">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${Math.min(
                            100,
                            ((myActiveToken.secondsRemaining || 0) / 120) * 100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Action Buttons Workflow */}
                <div className="staff-actions-workflow">
                  {myActiveToken.status === 'CALLED' && !myActiveToken.arrivedAt && (
                    <button
                      onClick={() => handleArrived(myActiveToken._id)}
                      className="btn btn-success btn-lg"
                      disabled={actionLoading}
                    >
                      🙋 Mark Customer Arrived
                    </button>
                  )}

                  {myActiveToken.status === 'CALLED' && myActiveToken.arrivedAt && (
                    <button
                      onClick={() => handleStartService(myActiveToken._id)}
                      className="btn btn-primary btn-lg"
                      disabled={actionLoading}
                    >
                      ▶️ Start Service
                    </button>
                  )}

                  {myActiveToken.status === 'IN_SERVICE' && (
                    <button
                      onClick={() => handleComplete(myActiveToken._id)}
                      className="btn btn-success btn-lg"
                      disabled={actionLoading}
                    >
                      ✅ Complete Service
                    </button>
                  )}

                  {myActiveToken.status === 'CALLED' && (
                    <button
                      onClick={() => handleMissed(myActiveToken._id)}
                      className="btn btn-danger"
                      disabled={actionLoading}
                    >
                      ⚠️ Mark as Missed (Requeue / Expire)
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="counter-idle-box">
                <div className="idle-icon">🪑</div>
                <h3>Counter #{counterNumber} is Ready</h3>
                <p>Call the next customer from the FIFO waiting queue.</p>
                <button
                  onClick={handleCallNext}
                  className="btn btn-primary btn-lg mt-3"
                  disabled={actionLoading || queueData.waitingQueue.length === 0}
                >
                  {actionLoading ? 'Calling...' : '📢 Call Next Customer'}
                </button>
                {queueData.waitingQueue.length === 0 && (
                  <p className="no-waiting-hint">No customers waiting in queue right now.</p>
                )}
              </div>
            )}
          </div>

          {/* Waiting Queue Table */}
          <div className="card mt-4">
            <div className="card-header">
              <span className="card-title">Live Waiting Queue (FIFO Order)</span>
              <span className="count-pill">{queueData.waitingQueue.length} Waiting</span>
            </div>

            {queueData.waitingQueue.length === 0 ? (
              <div className="empty-state">
                <p>No waiting tokens in the queue.</p>
              </div>
            ) : (
              <div className="queue-table-wrapper">
                <table className="queue-table">
                  <thead>
                    <tr>
                      <th>Position</th>
                      <th>Token</th>
                      <th>Service</th>
                      <th>Customer</th>
                      <th>Est. Wait</th>
                      <th>Missed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queueData.waitingQueue.map((item, index) => (
                      <tr key={item._id}>
                        <td>
                          <span className="pos-badge">#{index + 1}</span>
                        </td>
                        <td>
                          <strong>{item.tokenNumber}</strong>
                        </td>
                        <td>{item.serviceType}</td>
                        <td>{item.user?.name || 'Customer'}</td>
                        <td>~{item.predictedWaitTime || 5} min</td>
                        <td>
                          {item.missedCount > 0 ? (
                            <span className="missed-tag">{item.missedCount}x Missed</span>
                          ) : (
                            '0'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Activity & Completed History */}
        <div className="dashboard-sidebar">
          <div className="card history-card">
            <div className="card-header">
              <span className="card-title">Recent Queue Activity</span>
              <span className="count-pill">{queueData.recentHistory?.length || 0}</span>
            </div>

            {queueData.recentHistory?.length === 0 ? (
              <div className="empty-state">
                <p>No recent activity recorded.</p>
              </div>
            ) : (
              <div className="history-list">
                {queueData.recentHistory.map((item) => (
                  <div key={item._id} className="history-item">
                    <div className="history-top">
                      <span className="history-token-number">{item.tokenNumber}</span>
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="history-sub">
                      <span>{item.serviceType}</span>
                      <span>Counter {item.counter || 1}</span>
                    </div>
                    <div className="history-footer">
                      <span>Customer: {item.user?.name || 'Customer'}</span>
                    </div>
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

export default StaffDashboard;
