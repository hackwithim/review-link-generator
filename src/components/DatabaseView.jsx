import React, { useState } from 'react';

export default function DatabaseView({
  accounts,
  reviews,
  setReviews,
  setSelectedAccountId,
  setSelectedMode,
  setSelectedReviewId,
  setCurrentReviewText,
  setActiveTab,
  onResetQueue,
  showToast,
}) {
  const [search, setSearch] = useState('');
  const [filterAccount, setFilterAccount] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterLang, setFilterLang] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filter reviews
  const filtered = reviews.filter(r => {
    if (filterAccount !== 'all' && r.accountId !== filterAccount) return false;
    if (filterStatus === 'unposted' && r.isPosted) return false;
    if (filterStatus === 'posted' && !r.isPosted) return false;
    if (filterLang !== 'all' && r.language !== filterLang) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        (r.review && r.review.toLowerCase().includes(q)) ||
        (r.accountName && r.accountName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalFiltered = filtered.length;
  const totalPages = Math.ceil(totalFiltered / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginated = filtered.slice(startIndex, startIndex + pageSize);

  const handleSelectReview = r => {
    setSelectedAccountId(r.accountId);
    setSelectedMode('browse');
    setSelectedReviewId(r.id);
    setCurrentReviewText(r.review);
    setActiveTab('generator');
    showToast(`Loaded review #${r.id} into generator!`, '⚡');
  };

  return (
    <div className="inventory-section">
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div className="section-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 className="section-title">
              <span>📑 Master Reviews Sheet Inventory</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '0.25rem' }}>
              Showing entries synchronized from Google Sheets & NoSQL database ({reviews.length} Total across 4 accounts)
            </p>
          </div>
          <button
            className="btn-ghost-sm"
            onClick={onResetQueue}
            style={{ background: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5' }}
          >
            <span>🔄 Reset All Submitted Statuses</span>
          </button>
        </div>

        {/* Filters */}
        <div className="table-controls-bar">
          <div className="search-box-wrap">
            <span className="search-icon-pos">🔍</span>
            <input
              type="text"
              className="search-input"
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search across reviews or keywords..."
            />
          </div>

          <div className="filter-pills-row">
            <select
              className="filter-select"
              value={filterAccount}
              onChange={e => { setFilterAccount(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">All Locations (4)</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>

            <select
              className="filter-select"
              value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">All Statuses</option>
              <option value="unposted">🟢 Unposted Only</option>
              <option value="posted">🔵 Submitted/Posted Only</option>
            </select>

            <select
              className="filter-select"
              value={filterLang}
              onChange={e => { setFilterLang(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">All Languages</option>
              <option value="English">English</option>
              <option value="Marathi">Marathi</option>
              <option value="Hinglish">Hinglish</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="reviews-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>#</th>
                <th style={{ width: '190px' }}>Location Account</th>
                <th>Review Content</th>
                <th style={{ width: '95px' }}>Language</th>
                <th style={{ width: '110px' }}>Status</th>
                <th style={{ width: '130px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    No reviews found matching your search and filter criteria.
                  </td>
                </tr>
              ) : (
                paginated.map((r, idx) => {
                  const globalIdx = startIndex + idx + 1;
                  return (
                    <tr key={r.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{globalIdx}</td>
                      <td>
                        <strong style={{ color: '#f8fafc', fontSize: '0.85rem' }}>{r.accountName}</strong>
                      </td>
                      <td>
                        <div className="review-cell-text" title={r.review}>"{r.review}"</div>
                      </td>
                      <td>
                        <span className={`badge ${r.language === 'Marathi' ? 'badge-amber' : r.language === 'English' ? 'badge-indigo' : 'badge-emerald'}`}>
                          {r.language}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${r.isPosted ? 'badge-indigo' : 'badge-emerald'}`}>
                          {r.status || (r.isPosted ? 'Submitted' : 'Not Posted')}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn-ghost-sm"
                          onClick={() => handleSelectReview(r)}
                          style={{ display: 'inline-flex' }}
                        >
                          <span>Generate Link ➔</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="table-pagination">
          <div>
            Showing <strong>{startIndex + 1}</strong> to <strong>{Math.min(startIndex + pageSize, totalFiltered)}</strong> of <strong>{totalFiltered}</strong> reviews
          </div>
          <div className="page-btn-group">
            <button
              className="page-btn"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              Previous
            </button>
            <span style={{ padding: '0.25rem 0.5rem', fontWeight: 600, color: '#fff' }}>
              {currentPage} / {totalPages}
            </span>
            <button
              className="page-btn"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
