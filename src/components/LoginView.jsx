import React, { useState } from 'react';

export default function LoginView({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleQuickFill = () => {
    setUsername('admin');
    setPassword('admin@webworks');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please provide both username and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid username or password.');
      }

      onLoginSuccess(data.token, data.user);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      {/* Background ambient lighting */}
      <div className="login-ambient-glow glow-1"></div>
      <div className="login-ambient-glow glow-2"></div>

      <div className="login-card glass-panel">
        {/* Security Shield & Header */}
        <div className="login-card-header">
          <div className="security-icon-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <div className="login-tag">
            <span className="live-dot"></span>
            RESTRICTED ACCESS
          </div>
          <h1 className="login-title">ReviewFlow Studio</h1>
          <p className="login-subtitle">
            Enterprise Link Management & Review Flow Console. Please authenticate to access dashboard operations.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="login-error-banner" role="alert">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="username">
              <span>Admin Username</span>
            </label>
            <div className="input-with-icon">
              <span className="input-prefix-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </span>
              <input
                id="username"
                type="text"
                className="login-input"
                placeholder="e.g. admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              <span>Password</span>
            </label>
            <div className="input-with-icon">
              <span className="input-prefix-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="login-input password-input"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-login-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="login-spinner"></span>
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Unlock Dashboard</span>
                <span className="login-btn-arrow">→</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Access Bar */}
        <div className="demo-credentials-box">
          <div className="demo-header">
            <span className="demo-pill">DEFAULT ADMIN</span>
            <button
              type="button"
              className="btn-quick-fill"
              onClick={handleQuickFill}
            >
              ⚡ Quick Fill
            </button>
          </div>
          <div className="demo-creds-details">
            <div>User: <code>admin</code></div>
            <div>Pass: <code>admin@webworks</code></div>
          </div>
        </div>

        {/* Footer Guarantee */}
        <div className="login-footer-notice">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          <span>Recipient review links (`?r=...`) remain public & friction-free.</span>
        </div>
      </div>
    </div>
  );
}
