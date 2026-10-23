import React, { useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import { encodePayload } from '../App.jsx';

export default function GeneratorView({
  accounts,
  reviews,
  selectedAccountId,
  setSelectedAccountId,
  selectedMode,
  setSelectedMode,
  linkMode,
  setLinkMode,
  currentAcc,
  currentReviewText,
  setCurrentReviewText,
  customReviewInput,
  setCustomReviewInput,
  selectedReviewId,
  setSelectedReviewId,
  redirectUrl,
  setRedirectUrl,
  onAdvanceQueue,
  showToast,
}) {
  const qrCanvasRef = useRef(null);

  // Compute unposted count for current account
  const accReviews = reviews.filter(r => r.accountId === selectedAccountId);
  const unpostedAccCount = accReviews.filter(r => !r.isPosted).length;

  // Build generated link
  const baseUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
  let generatedUrl = '';

  if (linkMode === 'rotating') {
    const payload = {
      dyn: true,
      a: currentAcc.id,
      an: currentAcc.name,
      m: currentAcc.mapUrl,
      u: redirectUrl || 'https://webworksstudios.com/',
    };
    generatedUrl = `${baseUrl}?r=${encodePayload(payload)}`;
  } else {
    const payload = {
      id: selectedReviewId,
      a: currentAcc.id,
      an: currentAcc.name,
      m: currentAcc.mapUrl,
      t: currentReviewText,
      u: redirectUrl || 'https://webworksstudios.com/',
    };
    generatedUrl = `${baseUrl}?r=${encodePayload(payload)}`;
  }

  // Draw QR code on canvas
  useEffect(() => {
    if (qrCanvasRef.current && generatedUrl) {
      QRCode.toCanvas(qrCanvasRef.current, generatedUrl, {
        width: 140,
        margin: 1,
        color: {
          dark: '#0a0d14',
          light: '#ffffff',
        },
      }).catch(err => console.error(err));
    }
  }, [generatedUrl]);

  // Copy Link Handler
  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(generatedUrl);
      showToast('Review link copied to clipboard!', '📋');
    }
  };

  // WhatsApp Share Handler
  const handleWhatsApp = () => {
    const text = `Hey! Could you please take 5 seconds to leave a 5-star Google review for ${currentAcc.name}? The review is already typed out for you here: ${generatedUrl}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  // Download QR
  const handleDownloadQR = () => {
    if (qrCanvasRef.current) {
      const link = document.createElement('a');
      link.download = `review-qr-${selectedAccountId}.png`;
      link.href = qrCanvasRef.current.toDataURL('image/png');
      link.click();
      showToast('QR Code downloaded as PNG!', '📥');
    }
  };

  // Shuffle alternate review
  const handleShuffle = () => {
    const unposted = reviews.filter(r => r.accountId === selectedAccountId && !r.isPosted);
    if (unposted.length > 0) {
      const rand = unposted[Math.floor(Math.random() * unposted.length)];
      setSelectedReviewId(rand.id);
      setCurrentReviewText(rand.review);
      showToast('Shuffled to another unposted review', '🎲');
    }
  };

  return (
    <>
      <section className="hero-banner">
        <div className="hero-pill">
          <span>🔄 NoSQL Live Auto-Rotating Progression Active</span>
        </div>
        <h1 className="hero-title">Automated Review Link Generator</h1>
        <p className="hero-subtitle">
          Connected to your 4 Google locations with live NoSQL persistence. Each time a review is submitted, the queue <strong>automatically advances to the next review</strong>!
        </p>
      </section>

      <div className="dashboard-grid">
        {/* Left Column: Form Setup */}
        <div className="glass-panel form-card">
          {/* Step 1: Location Account */}
          <div className="step-block">
            <div className="step-label">
              <span className="step-number">1</span>
              <span>Select Target Location Account</span>
            </div>

            <div className="accounts-selector-grid">
              {accounts.map(acc => {
                const isSelected = acc.id === selectedAccountId;
                const unposted = reviews.filter(r => r.accountId === acc.id && !r.isPosted).length;
                return (
                  <div
                    key={acc.id}
                    className={`account-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedAccountId(acc.id)}
                  >
                    <div className="acc-card-top">
                      <div className="acc-name">{acc.name}</div>
                      <div className="acc-check">
                        {isSelected && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="acc-meta">
                      <span className="acc-stars">★ {acc.rating}</span>
                      <span>•</span>
                      <span style={{ color: '#6ee7b7', fontWeight: 600 }}>{unposted} unposted</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="custom-link-box" style={{ marginTop: '0.85rem' }}>
              <span className="link-badge" style={{ color: '#34d399', background: 'rgba(16,185,129,0.15)' }}>
                ✓ Direct Review Dialog:
              </span>
              <input type="text" value={currentAcc.mapUrl} readOnly />
            </div>
          </div>

          {/* Step 2: Content & Delivery Strategy */}
          <div className="step-block">
            <div className="step-label">
              <span className="step-number">2</span>
              <span>Select Review & Queue Progression</span>
            </div>

            {/* Link Mode Toggle */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              flexWrap: 'wrap'
            }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>Link Delivery Mode:</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {linkMode === 'rotating'
                    ? '⚡ Dynamic: Link auto-advances to next unposted review after each submission'
                    : '📌 Fixed: Locked to the specific review displayed below'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  className={`btn-ghost-sm ${linkMode === 'rotating' ? 'active' : ''}`}
                  onClick={() => { setLinkMode('rotating'); showToast('Switched to Dynamic Auto-Rotating Link mode!', '🔄'); }}
                  style={linkMode === 'rotating' ? { background: 'rgba(99,102,241,0.25)', borderColor: 'var(--accent-primary)', color: '#fff' } : {}}
                >
                  🔄 Auto-Rotating
                </button>
                <button
                  className={`btn-ghost-sm ${linkMode === 'fixed' ? 'active' : ''}`}
                  onClick={() => { setLinkMode('fixed'); showToast('Switched to Fixed Review Link mode!', '📌'); }}
                  style={linkMode === 'fixed' ? { background: 'rgba(99,102,241,0.25)', borderColor: 'var(--accent-primary)', color: '#fff' } : {}}
                >
                  📌 Fixed Review
                </button>
              </div>
            </div>

            <div className="mode-toggle-group">
              <div
                className={`mode-btn ${selectedMode === 'unposted' ? 'active' : ''}`}
                onClick={() => setSelectedMode('unposted')}
              >
                <span className="mode-title">⚡ Next Unposted</span>
                <span className="mode-desc">Auto-pick next in queue</span>
              </div>
              <div
                className={`mode-btn ${selectedMode === 'browse' ? 'active' : ''}`}
                onClick={() => setSelectedMode('browse')}
              >
                <span className="mode-title">🔍 Browse Sheet</span>
                <span className="mode-desc">Pick specific review</span>
              </div>
              <div
                className={`mode-btn ${selectedMode === 'custom' ? 'active' : ''}`}
                onClick={() => setSelectedMode('custom')}
              >
                <span className="mode-title">✍️ Custom Text</span>
                <span className="mode-desc">Compose custom text</span>
              </div>
            </div>

            {selectedMode === 'custom' ? (
              <textarea
                className="custom-textarea"
                value={customReviewInput}
                onChange={e => {
                  setCustomReviewInput(e.target.value);
                  setCurrentReviewText(e.target.value);
                }}
                placeholder="Enter custom review text here..."
              />
            ) : (
              <div className="review-preview-box">
                <div className="review-preview-text">"{currentReviewText}"</div>
                <div className="review-preview-tags">
                  <div className="tag-pills">
                    <span className="badge badge-indigo">{currentAcc.name}</span>
                    <span className="badge badge-emerald">Ready for Link</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                    <button
                      className="btn-ghost-sm"
                      onClick={onAdvanceQueue}
                      style={{ background: 'rgba(16,185,129,0.18)', borderColor: 'rgba(16,185,129,0.4)', color: '#6ee7b7', fontWeight: 700 }}
                    >
                      <span>⏩ Mark Used & Load Next</span>
                    </button>
                    <button className="btn-ghost-sm" onClick={handleShuffle}>
                      <span>🎲 Shuffle</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Redirect Destination */}
          <div className="step-block">
            <div className="step-label">
              <span className="step-number">3</span>
              <span>Post-Submission Redirect Destination</span>
            </div>
            <div className="input-with-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" style={{ flexShrink: 0 }}>
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
              <input
                type="text"
                value={redirectUrl}
                onChange={e => setRedirectUrl(e.target.value)}
                placeholder="https://webworksstudios.com/"
              />
            </div>
          </div>

          <button
            className="btn-primary-action"
            onClick={() => showToast('Smart Review Link updated successfully!', '🚀')}
          >
            <span>🚀 Generate Review Link</span>
          </button>
        </div>

        {/* Right Column: Output Showcase */}
        <div className="output-showcase-panel">
          <div className="glass-panel generated-result-card">
            <div className="result-header">
              <span className="section-title">
                <span>🔗 Generated Review Link</span>
              </span>
              <span className="result-status">
                <span className="status-dot"></span> Active & Ready
              </span>
            </div>

            <div className="link-display-box">
              <span className="link-url-text">{generatedUrl}</span>
            </div>

            <div className="actions-row">
              <button className="btn-action-tile" onClick={handleCopy}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span>Copy Link</span>
              </button>
              <button className="btn-action-tile btn-whatsapp" onClick={handleWhatsApp}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
                </svg>
                <span>Share WhatsApp</span>
              </button>
            </div>

            <div className="qr-preview-container">
              <div className="qr-canvas-wrapper">
                <canvas ref={qrCanvasRef}></canvas>
              </div>
              <div className="qr-caption">Scan with mobile camera to open & auto-type review</div>
              <button className="btn-ghost-sm" onClick={handleDownloadQR}>
                <span>📥 Download QR Code</span>
              </button>
            </div>

            <div style={{ marginTop: '1.25rem' }}>
              <button
                className="btn-action-tile"
                style={{ width: '100%', background: 'rgba(99,102,241,0.15)', borderColor: 'var(--accent-primary)' }}
                onClick={() => window.open(generatedUrl, '_blank')}
              >
                <span>👁️ Test Recipient Flow (Preview Experience)</span>
              </button>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.35rem' }}>
            <div className="section-title" style={{ marginBottom: '0.85rem', fontSize: '1rem' }}>
              <span>⚡ Full-Stack NoSQL Architecture</span>
            </div>
            <ul className="feature-checklist">
              <li>
                <span className="check-icon">✓</span>
                <span><strong>NoSQL Submissions Store</strong>: Logs all completed reviews with timestamp and metadata into MongoDB / document store.</span>
              </li>
              <li>
                <span className="check-icon">✓</span>
                <span><strong>Auto-Queue Progression</strong>: Automatically advances to the next unposted review after every submission.</span>
              </li>
              <li>
                <span className="check-icon">✓</span>
                <span><strong>Direct Review Modal (!9m1!1b1)</strong>: Directly launches the official Google Review 5-star dialog without timeout error.</span>
              </li>
              <li>
                <span className="check-icon">✓</span>
                <span><strong>Guaranteed Redirection</strong>: Seamlessly redirects the user to <a href="https://webworksstudios.com/" target="_blank" rel="noreferrer" style={{ color: '#a5b4fc', textDecoration: 'none' }}>webworksstudios.com</a> after posting!</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
