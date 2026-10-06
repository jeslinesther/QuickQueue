import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, isAuthenticated, logout, isStaff, isUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          <span className="brand-icon">⚡</span>
          <span className="brand-name">QuickQueue</span>
          <span className="brand-tag">AI Powered</span>
        </Link>

        <div className="nav-links">
          {isAuthenticated ? (
            <>
              {isUser && (
                <Link to="/user/dashboard" className="nav-link">
                  My Dashboard
                </Link>
              )}
              {isStaff && (
                <Link to="/staff/dashboard" className="nav-link">
                  Counter Dashboard (Counter #{user.counterNumber})
                </Link>
              )}
              <div className="user-profile-badge">
                <span className="user-name">{user.name}</span>
                <span className={`role-pill role-${user.role}`}>
                  {user.role.toUpperCase()}
                </span>
              </div>
              <button onClick={handleLogout} className="btn-secondary btn-sm">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                Customer Login
              </Link>
              <Link to="/register" className="btn-primary btn-sm">
                Register
              </Link>
              <Link to="/staff/login" className="nav-link staff-nav-link">
                Staff Portal 🛡️
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
