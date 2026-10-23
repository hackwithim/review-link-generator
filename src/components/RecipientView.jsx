import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';

export default function RecipientView({ payload, onRefresh }) {
  const accountName = payload.an || payload.accountName || 'Dignitary Defence Academy';
  const mapUrl = payload.m || payload.mapUrl || 'https://www.google.com/maps';
  const redirectTarget = payload.u || payload.r || payload.redirectUrl || 'https://webworksstudios.com/';
  const reviewId = payload.id || null;

  // Clean, proper review message without unwanted quotes or artifacts
  const rawReviewText = payload.t || payload.reviewText || 'Excellent coaching, disciplined environment, and very supportive mentors!';
  const cleanReviewText = rawReviewText
    .trim()
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, '')
    .replace(/\\"/g, '"');

  const [typedText, setTypedText] = useState('');
  const [isTypingDone, setIsTypingDone] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [countdown, setCountdown] = useState(4);

  // Reliable cross-browser clipboard copy with NoSQL telemetry logging
  const copyToClipboard = useCallback(async (textToCopy, trigger = 'manual') => {
    let copied = false;

    // 1. Modern Clipboard API
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(textToCopy);
        copied = true;
      }
    } catch (err) {
      // Fallback below
    }

    // 2. Legacy execCommand Fallback (for mobile webviews / strict permissions)
    if (!copied) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        copied = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch (e) {
        console.warn('Fallback copy failed', e);
      }
    }

    // 3. Post telemetry entry to NoSQL database
    try {
      fetch('/api/reviews/copy-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId,
          reviewText: textToCopy,
          accountId: payload.a || payload.accountId || null,
          trigger,
        }),
      }).catch(() => {});
    } catch (e) {}

    return copied;
  }, [reviewId, payload]);

  // Initial copy on load
  useEffect(() => {
    copyToClipboard(cleanReviewText, 'auto');
  }, [cleanReviewText, copyToClipboard]);

  // Auto-typing animation
  useEffect(() => {
    let currentIdx = 0;
    const interval = setInterval(() => {
      if (currentIdx < cleanReviewText.length) {
        setTypedText(cleanReviewText.slice(0, currentIdx + 1));
        currentIdx++;
      } else {
        setIsTypingDone(true);
        clearInterval(interval);
      }
    }, 14);

    return () => clearInterval(interval);
  }, [cleanReviewText]);

  // Countdown timer after submission
  useEffect(() => {
    if (!isSubmitted) return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      window.location.href = redirectTarget;
    }
  }, [isSubmitted, countdown, redirectTarget]);

  // Manual Copy Button Handler
  const handleManualCopy = async () => {
    await copyToClipboard(cleanReviewText, 'manual_button');
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 3000);
  };

  // Submission Click Handler
  const handleSubmitClick = async () => {
    // 1. Always copy text right on submit gesture
    await copyToClipboard(cleanReviewText, 'submit_action');

    // 2. Open Google Maps review popup directly
    const win = window.open(mapUrl, '_blank');
    if (!win) {
      window.location.href = mapUrl;
    }

    // 3. Record official submission in NoSQL backend
    try {
      await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId,
          reviewText: cleanReviewText,
          accountId: payload.a || payload.accountId || null,
        }),
      });
      if (onRefresh) onRefresh();
    } catch (e) {
      console.warn('Backend submission sync error:', e);
    }

    // 4. Confetti Celebration
    confetti({
      particleCount: 130,
      spread: 75,
      origin: { y: 0.6 },
    });

    // 5. Switch to celebration state
    setIsSubmitted(true);
  };

  return (
    <div className="recipient-view-wrapper">
      <div className="recipient-card">
        {!isSubmitted ? (
          <>
            <div className="academy-logo-badge">🛡️</div>
            <h1 className="recipient-title">{accountName}</h1>
            <p className="recipient-subtitle">
              Your rating and feedback help future students and defence aspirants make the right choice.
            </p>

            <div className="star-rating-showcase">
              {[1, 2, 3, 4, 5].map(i => (
                <svg key={i} className="star-icon" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>

            {/* Review Card */}
            <div className="auto-typing-container">
              <div className="auto-typing-label">
                <span>✍️ Your Pre-Composed Review</span>
                <span style={{ color: '#6ee7b7', fontSize: '0.75rem', fontWeight: 600 }}>
                  {isTypingDone ? 'Ready to Paste' : 'Composing...'}
                </span>
              </div>
              <div className="typing-text">{typedText}</div>
              {!isTypingDone && <span className="typing-cursor"></span>}
            </div>

            {/* Copy Feedback / Action Bar */}
            <div style={{ display: 'flex', gap: '0.5rem', width: '100%', marginTop: '0.25rem' }}>
              <button
                type="button"
                className="btn-manual-copy"
                onClick={handleManualCopy}
                title="Click to copy this review text"
              >
                <span>{copyFeedback ? '✓ Copied to Clipboard!' : '📋 Copy Review Text'}</span>
              </button>
            </div>

            <div className="clipboard-status-badge">
              <span>{copyFeedback ? '✓' : '📋'}</span>
              <span>
                {copyFeedback
                  ? 'Review copied! Paste it in Google Maps and select 5 stars.'
                  : 'Review automatically copied to clipboard!'}
              </span>
            </div>

            {/* Primary Action Button */}
            <button className="btn-submit-google" onClick={handleSubmitClick}>
              <span>⭐⭐⭐⭐⭐ Tap to Submit on Google</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>

            {/* Process Instructions */}
            <div className="steps-helper-box">
              <div className="steps-helper-title">Quick 3-Second Process:</div>
              <div className="helper-step-item">
                <div className="step-dot-num">1</div>
                <div>Tap the button above (review is copied & Google Maps dialog opens)</div>
              </div>
              <div className="helper-step-item">
                <div className="step-dot-num">2</div>
                <div>Paste your review (press Paste or Ctrl+V) and choose 5 stars</div>
              </div>
              <div className="helper-step-item">
                <div className="step-dot-num">3</div>
                <div>Click <strong>Post</strong> — you'll be redirected to Webworks Studios!</div>
              </div>
            </div>
          </>
        ) : (
          <div className="redirect-screen-overlay">
            <div className="celebration-icon">🎉</div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.4rem, 5vw, 1.75rem)', fontWeight: 800, color: '#fff' }}>
              Thank You for Your Feedback!
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: '440px', lineHeight: 1.5 }}>
              Your 5-star review has been recorded. The review queue has advanced to the next review automatically.
            </p>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.15rem 1.25rem', width: '100%' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Redirecting to Webworks Studios in
              </div>
              <div className="countdown-radial-box">
                <span className="countdown-number">{countdown}</span>
                <span style={{ fontSize: '0.95rem' }}>seconds...</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', alignItems: 'center' }}>
              <a href={redirectTarget} className="btn-redirect-now">
                <span>Continue to Webworks Studios now</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
