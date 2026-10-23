import React, { useState, useEffect } from 'react';

export default function ActivityLogView({ accounts, authToken, showToast }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'copied' | 'submitted'
  const [search, setSearch] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const fetchActivity = async () => {
    if (!authToken) return;
    try {
      const res = await fetch('/api/activity', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setLogs(data);
          setLastRefreshed(new Date());
        }
      }
    } catch (e) {
      console.warn('Failed to load activity logs', e);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and auto-refresh every 4s
  useEffect(() => {
    fetchActivity();
    const interval = setInterval(fetchActivity, 4000);
    return () => clearInterval(interval);
  }, [authToken]);

  // Account lookup
  const getAccountName = (accId) => {
    const acc = accounts.find((a) => a.id === accId);
    return acc ? acc.name : accId || 'All Accounts';
  };

  // Metrics
  const copiedCount = logs.filter((l) => l.type === 'copied').length;
  const submittedCount = logs.filter((l) => l.type === 'submitted').length;

  // Filtered logs
  const filteredLogs = logs.filter((l) => {
    if (filterType !== 'all' && l.type !== filterType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const text = (l.reviewText || '').toLowerCase();
      const id = (l.reviewId || '').toLowerCase();
      const acc = getAccountName(l.accountId).toLowerCase();
      return text.includes(q) || id.includes(q) || acc.includes(q);
    }
    return true;
  });

  return (
    <div className="inventory-section">
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        {/* Header */}
        <div className="section-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h2 className="section-title">
                <span>📋 Live Copied Messages & Submission Audit Log</span>
              </h2>
              <span className="status-pill" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#6ee7b7' }}>
                <span className="status-dot"></span>
                <span>Live Realtime Sync</span>
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', marginTop: '0.35rem' }}>
              Real-time audit log of review messages copied to clipboard and submitted on Google Maps. Last synced at{' '}
              {lastRefreshed.toLocaleTimeString()}.
            </p>
          </div>

          <button
            type="button"
            className="btn-ghost-sm"
            onClick={() => {
              fetchActivity();
              showToast('Activity log refreshed!', '🔄');
            }}
          >
            <span>🔄 Refresh Now</span>
          </button>
        </div>

        {/* Metric Cards Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', margin: '1.25rem 0' }}>
          <div className="glass-panel" style={{ padding: '1rem 1.25rem', background: 'rgba(255, 255, 255, 0.02)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Logged Events
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#fff', marginTop: '0.2rem' }}>
              {logs.length}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1rem 1.25rem', background: 'rgba(245, 158, 11, 0.05)', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
            <div style={{ fontSize: '0.75rem', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              📋 Review Messages Copied
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#fbbf24', marginTop: '0.2rem' }}>
              {copiedCount}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1rem 1.25rem', background: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
            <div style={{ fontSize: '0.75rem', color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ✅ Reviews Submitted to Google
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#6ee7b7', marginTop: '0.2rem' }}>
              {submittedCount}
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="table-controls-bar">
          <div className="search-box-wrap">
            <span className="search-icon-pos">🔍</span>
            <input
              type="text"
              className="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by review text, location or ID..."
            />
          </div>

          <div className="filter-pills-row">
            <select
              className="filter-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Events ({logs.length})</option>
              <option value="copied">📋 Copied Only ({copiedCount})</option>
              <option value="submitted">✅ Submitted Only ({submittedCount})</option>
            </select>
          </div>
        </div>

        {/* Activity Table */}
        <div className="table-responsive">
          <table className="reviews-table">
            <thead>
              <tr>
                <th style={{ width: '120px' }}>Event</th>
                <th style={{ width: '130px' }}>Timestamp</th>
                <th style={{ width: '220px' }}>Location</th>
                <th style={{ width: '110px' }}>Review ID</th>
                <th>Copied / Submitted Message</th>
                <th style={{ width: '120px' }}>Trigger</th>
              </tr>
            </thead>
            <tbody>
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    Loading real-time activity log...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    {logs.length === 0
                      ? 'No copy or submission events logged yet. When a user opens a review link or copies a review, it will automatically record and reflect here live!'
                      : 'No activity matches your search filters.'}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => {
                  const isSubmitted = log.type === 'submitted';
                  const dateObj = new Date(log.timestamp || log.createdAt);
                  const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  const formattedDate = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });

                  return (
                    <tr key={log._id || idx}>
                      <td>
                        <span className={`badge ${isSubmitted ? 'badge-emerald' : 'badge-amber'}`}>
                          {isSubmitted ? '✅ Submitted' : '📋 Copied'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <div>{formattedTime}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{formattedDate}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.85rem' }}>
                          {getAccountName(log.accountId)}
                        </div>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.76rem', color: '#94a3b8' }}>
                        {log.reviewId || 'dynamic_next'}
                      </td>
                      <td>
                        <div className="review-cell-text" title={log.reviewText}>
                          "{log.reviewText}"
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                          {log.trigger === 'auto' ? 'Silent Auto' : log.trigger === 'manual_button' ? 'Copy Button' : log.trigger === 'submit_action' ? 'Google Tap' : (log.trigger || 'manual')}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
