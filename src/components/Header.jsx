import React from 'react';

export default function Header({
  activeTab,
  setActiveTab,
  totalReviews,
  onResetQueue,
  currentUser,
  onLogout,
}) {
  return (
    <header className="app-header">
      <div className="header-container">
        <div className="header-top-row">
          <div className="brand-wrapper" onClick={() => setActiveTab('generator')}>
            <div className="brand-logo">
              <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            </div>
            <div>
              <div className="brand-title">ReviewFlow Studio</div>
              <div className="brand-tag">Powered by Webworks Studios</div>
            </div>
          </div>

          <div className="header-badges">
            <div className="status-pill">
              <span className="status-dot"></span>
              <span><strong>{totalReviews}</strong> Reviews Live</span>
            </div>

            <button
              className="status-pill"
              onClick={onResetQueue}
              title="Click to reset submitted review statuses in NoSQL database"
              style={{ cursor: 'pointer', background: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5' }}
            >
              <span>🔄 Reset Queue</span>
            </button>

            {currentUser && (
              <div className="user-session-badge" title={`Authenticated as ${currentUser.username || 'Admin'}`}>
                <span className="user-avatar-dot"></span>
                <span>👤 {currentUser.username || 'admin'}</span>
              </div>
            )}

            {onLogout && (
              <button
                className="btn-logout"
                onClick={onLogout}
                title="Log out and lock dashboard"
              >
                <span>🚪 Logout</span>
              </button>
            )}
          </div>
        </div>

        <nav className="nav-tabs">
          <button
            className={`tab-btn ${activeTab === 'generator' ? 'active' : ''}`}
            onClick={() => setActiveTab('generator')}
          >
            <span>⚡ Link Generator</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'database' ? 'active' : ''}`}
            onClick={() => setActiveTab('database')}
          >
            <span>📑 Master Sheet ({totalReviews})</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            <span>📋 Copied & Submissions Log</span>
          </button>
        </nav>

      </div>
    </header>
  );
}
