import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginStaff, registerStaff } from '../services/authService';

function StaffLogin() {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    counterNumber: '1',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { handleAuthSuccess } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      let res;
      if (isRegisterMode) {
        if (!formData.name || !formData.email || !formData.password || !formData.counterNumber) {
          setError('Please provide name, email, password, and counter number');
          setLoading(false);
          return;
        }
        res = await registerStaff(formData);
      } else {
        if (!formData.email || !formData.password) {
          setError('Please provide email and password');
          setLoading(false);
          return;
        }
        res = await loginStaff({ email: formData.email, password: formData.password });
      }

      if (res.success) {
        handleAuthSuccess(res.token, res.staff);
        navigate('/staff/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Staff authentication failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card staff-auth-card">
        <div className="auth-header">
          <div className="staff-icon-badge">🛡️</div>
          <h2>Counter Staff Portal</h2>
          <p>Manage token calls, arrivals, and counter operations</p>
        </div>

        <div className="auth-mode-toggle">
          <button
            type="button"
            className={`toggle-btn ${!isRegisterMode ? 'active' : ''}`}
            onClick={() => {
              setIsRegisterMode(false);
              setError('');
            }}
          >
            Staff Sign In
          </button>
          <button
            type="button"
            className={`toggle-btn ${isRegisterMode ? 'active' : ''}`}
            onClick={() => {
              setIsRegisterMode(true);
              setError('');
            }}
          >
            Register Counter Staff
          </button>
        </div>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {isRegisterMode && (
            <>
              <div className="form-group">
                <label htmlFor="name">Staff Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Officer James"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="counterNumber">Assigned Counter Number</label>
                <input
                  type="number"
                  id="counterNumber"
                  name="counterNumber"
                  value={formData.counterNumber}
                  onChange={handleChange}
                  min="1"
                  max="20"
                  required
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="email">Staff Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. counter1@quickqueue.internal"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading
              ? 'Processing...'
              : isRegisterMode
              ? 'Register Staff Member'
              : 'Sign In to Counter'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Looking for customer queue? <Link to="/login">Go to Customer Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default StaffLogin;
