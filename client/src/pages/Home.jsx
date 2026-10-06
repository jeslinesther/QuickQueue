import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Home() {
  const { isAuthenticated, isStaff, isUser } = useAuth();

  return (
    <div className="landing-page">
      <div className="hero-card">
        <div className="badge-pill">Smart Queue Management</div>
        <h1 className="hero-title">QuickQueue</h1>
        <p className="hero-subtitle">
          AI-Powered Smart Queue Management System designed to eliminate waiting lines,
          optimize counter workflows, and provide accurate wait-time forecasts.
        </p>

        <div className="hero-actions">
          {isAuthenticated ? (
            isStaff ? (
              <Link to="/staff/dashboard" className="btn btn-primary btn-lg">
                Go to Counter Dashboard 🛡️
              </Link>
            ) : (
              <Link to="/user/dashboard" className="btn btn-primary btn-lg">
                Go to My Queue Dashboard ⚡
              </Link>
            )
          ) : (
            <>
              <Link to="/login" className="btn btn-primary btn-lg">
                Customer Sign In
              </Link>
              <Link to="/register" className="btn btn-secondary btn-lg">
                Create Account
              </Link>
              <Link to="/staff/login" className="btn btn-outline btn-lg">
                Staff Counter Login 🛡️
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="features-grid">
        <div className="feature-box">
          <div className="feature-icon">🤖</div>
          <h3>AI Wait Prediction</h3>
          <p>
            Machine-learning model forecasts accurate waiting times based on real-time queue congestion,
            service complexity, and counter throughput.
          </p>
        </div>

        <div className="feature-box">
          <div className="feature-icon">⏱️</div>
          <h3>2-Minute Grace Period</h3>
          <p>
            Fair calling logic with automated 2-minute arrival windows and smart requeuing at the end of
            the queue.
          </p>
        </div>

        <div className="feature-box">
          <div className="feature-icon">📱</div>
          <h3>Live Queue Tracking</h3>
          <p>
            Real-time status updates, live queue positions, number of people ahead, and in-app
            notifications for arriving turns.
          </p>
        </div>

        <div className="feature-box">
          <div className="feature-icon">🛡️</div>
          <h3>Counter Staff Workflow</h3>
          <p>
            Seamless counter management with FIFO token calling, arrival verification, and service
            completion tracking.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Home;
