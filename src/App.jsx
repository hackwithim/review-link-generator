import React, { useState, useEffect, useCallback } from 'react';
import initialAccounts from './data/accounts.json';
import initialReviews from './data/reviews.json';
import Header from './components/Header.jsx';
import GeneratorView from './components/GeneratorView.jsx';
import DatabaseView from './components/DatabaseView.jsx';
import RecipientView from './components/RecipientView.jsx';
import LoginView from './components/LoginView.jsx';

// UTF-8 safe base64 encoding & decoding
export function encodePayload(obj) {
  try {
    const jsonStr = JSON.stringify(obj);
    return btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (match, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    }));
  } catch (e) {
    console.error('Encoding error:', e);
    return '';
  }
}

export function decodePayload(str) {
  try {
    const jsonStr = decodeURIComponent(atob(str).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('Decoding error:', e);
    return null;
  }
}

export default function App() {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [reviews, setReviews] = useState(initialReviews);
  const [selectedAccountId, setSelectedAccountId] = useState(initialAccounts[0]?.id || 'dignitary_defence');
  const [selectedMode, setSelectedMode] = useState('unposted'); // 'unposted' | 'browse' | 'custom'
  const [linkMode, setLinkMode] = useState('rotating'); // 'rotating' | 'fixed'
  const [selectedReviewId, setSelectedReviewId] = useState(null);
  const [currentReviewText, setCurrentReviewText] = useState('');
  const [customReviewInput, setCustomReviewInput] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('https://webworksstudios.com/');
  const [activeTab, setActiveTab] = useState('generator'); // 'generator' | 'database'
  const [toast, setToast] = useState(null);
  const [recipientPayload, setRecipientPayload] = useState(null);
  const [isRecipientMode, setIsRecipientMode] = useState(false);

  // Authentication State
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('reviewflow_token') || '');
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('reviewflow_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Show Toast helper
  const showToast = (message, icon = '✓') => {
    setToast({ message, icon });
    setTimeout(() => setToast(null), 3000);
  };

  // Logout handler
  const handleLogout = useCallback(() => {
    localStorage.removeItem('reviewflow_token');
    localStorage.removeItem('reviewflow_user');
    setAuthToken('');
    setCurrentUser(null);
    showToast('Dashboard locked. Session terminated safely.', '🔒');
  }, []);

  // Fetch accounts from Node + NoSQL API with Auth
  const refreshFromBackend = useCallback(async (tokenToUse) => {
    const activeToken = tokenToUse || authToken;
    if (!activeToken) return;

    try {
      const accRes = await fetch('/api/accounts', {
        headers: {
          'Authorization': `Bearer ${activeToken}`,
        },
      });

      if (accRes.status === 401 || accRes.status === 403) {
        handleLogout();
        return;
      }

      if (accRes.ok) {
        const accData = await accRes.json();
        if (Array.isArray(accData) && accData.length > 0) {
          setAccounts(accData);
        }
      }
    } catch (e) {
      // Backend offline, fallback to local state
    }
  }, [authToken, handleLogout]);

  // Handle successful login
  const handleLoginSuccess = (token, user) => {
    localStorage.setItem('reviewflow_token', token);
    localStorage.setItem('reviewflow_user', JSON.stringify(user));
    setAuthToken(token);
    setCurrentUser(user);
    showToast(`Access granted! Welcome, ${user.username}.`, '🛡️');
    refreshFromBackend(token);
  };

  // Verify stored token validity with backend on load
  useEffect(() => {
    const verifySavedToken = async () => {
      const storedToken = localStorage.getItem('reviewflow_token');
      if (!storedToken) return;

      try {
        const res = await fetch('/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${storedToken}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.valid && data.user) {
            setCurrentUser(data.user);
            setAuthToken(storedToken);
            refreshFromBackend(storedToken);
          } else {
            handleLogout();
          }
        } else {
          handleLogout();
        }
      } catch (e) {
        // Network failure; keep local session
      }
    };

    verifySavedToken();
  }, [refreshFromBackend, handleLogout]);

  // Check URL parameters on initial load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const rParam = urlParams.get('r');
    const accountParam = urlParams.get('account') || urlParams.get('a');
    const idParam = urlParams.get('id');

    // 1. Encoded recipient link
    if (rParam) {
      const payload = decodePayload(rParam);
      if (payload) {
        setRecipientPayload(payload);
        setIsRecipientMode(true);
        return;
      }
    }

    // 2. Rotating account link
    if (accountParam && !rParam) {
      const acc = accounts.find(a => a.id === accountParam) || accounts[0];
      const unposted = reviews.filter(r => r.accountId === acc.id && !r.isPosted);
      const chosen = unposted[0] || reviews.find(r => r.accountId === acc.id) || { id: 'fallback', review: 'Excellent experience and disciplined mentoring!' };
      setRecipientPayload({
        id: chosen.id,
        accountId: acc.id,
        accountName: acc.name,
        mapUrl: acc.mapUrl,
        reviewText: chosen.review,
        redirectUrl: urlParams.get('u') || 'https://webworksstudios.com/',
        isDynamicRotating: true,
      });
      setIsRecipientMode(true);
      return;
    }

    // 3. Direct ID link
    if (idParam) {
      const rev = reviews.find(r => r.id === idParam);
      const acc = accounts.find(a => a.id === urlParams.get('a')) || accounts[0];
      setRecipientPayload({
        id: rev ? rev.id : idParam,
        accountId: acc.id,
        accountName: acc.name,
        mapUrl: acc.mapUrl,
        reviewText: rev ? rev.review : urlParams.get('t') || '',
        redirectUrl: urlParams.get('u') || 'https://webworksstudios.com/',
      });
      setIsRecipientMode(true);
      return;
    }

    // If on admin view and has token, refresh accounts
    if (authToken) {
      refreshFromBackend(authToken);
    }
  }, [authToken, refreshFromBackend]);

  // Update current review whenever account or mode changes
  useEffect(() => {
    if (isRecipientMode) return;
    const currentAcc = accounts.find(a => a.id === selectedAccountId);
    if (!currentAcc) return;

    if (selectedMode === 'unposted') {
      const unposted = reviews.filter(r => r.accountId === selectedAccountId && !r.isPosted);
      if (unposted.length > 0) {
        setSelectedReviewId(unposted[0].id);
        setCurrentReviewText(unposted[0].review);
      } else {
        const anyRev = reviews.find(r => r.accountId === selectedAccountId);
        setSelectedReviewId(anyRev ? anyRev.id : null);
        setCurrentReviewText(anyRev ? anyRev.review : 'High quality training and supportive faculty.');
      }
    } else if (selectedMode === 'browse') {
      if (!selectedReviewId) {
        const first = reviews.find(r => r.accountId === selectedAccountId);
        if (first) {
          setSelectedReviewId(first.id);
          setCurrentReviewText(first.review);
        }
      } else {
        const rev = reviews.find(r => r.id === selectedReviewId);
        if (rev) setCurrentReviewText(rev.review);
      }
    } else if (selectedMode === 'custom') {
      setCurrentReviewText(customReviewInput.trim() || 'Dignitary Defence Academy provides outstanding mentoring and fitness training.');
    }
  }, [selectedAccountId, selectedMode, reviews, isRecipientMode]);

  // Handle Mark Used / Advance queue
  const handleAdvanceQueue = async () => {
    if (!selectedReviewId) return;

    // Call NoSQL backend with auth token
    try {
      await fetch(`/api/reviews/advance/${selectedAccountId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ currentReviewId: selectedReviewId })
      });
    } catch (e) {}

    // Update frontend state
    setReviews(prev => prev.map(r => r.id === selectedReviewId ? { ...r, isPosted: true, status: 'Submitted' } : r));
    showToast('Review marked as used! Loaded next fresh review.', '⏩');
    refreshFromBackend();
  };

  // Handle Reset Queue
  const handleResetQueue = async () => {
    if (!window.confirm('Reset all submitted reviews? This will restore all reviews back to the unposted queue in NoSQL DB.')) return;

    try {
      await fetch('/api/reviews/reset', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
    } catch (e) {}

    setReviews(JSON.parse(JSON.stringify(initialReviews)));
    showToast('All reviews restored to unposted queue in NoSQL DB!', '🔄');
    refreshFromBackend();
  };

  // =====================================================================
  // ROUTE 1: PUBLIC RECIPIENT MODE (Bypasses Login for Customers/Students)
  // =====================================================================
  if (isRecipientMode && recipientPayload) {
    return <RecipientView payload={recipientPayload} onRefresh={() => {}} />;
  }

  // =====================================================================
  // ROUTE 2: PROTECTED ADMIN DASHBOARD (Requires Valid Credentials)
  // =====================================================================
  if (!authToken) {
    return (
      <>
        <LoginView onLoginSuccess={handleLoginSuccess} />
        {toast && (
          <div className="toast-container">
            <div className="toast">
              <span style={{ color: '#10b981', fontWeight: 'bold' }}>{toast.icon}</span>
              <span>{toast.message}</span>
            </div>
          </div>
        )}
      </>
    );
  }

  const currentAcc = accounts.find(a => a.id === selectedAccountId) || accounts[0];

  return (
    <div className="app-container">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalReviews={reviews.length}
        onResetQueue={handleResetQueue}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <main className="app-main">
        {activeTab === 'generator' ? (
          <GeneratorView
            accounts={accounts}
            reviews={reviews}
            selectedAccountId={selectedAccountId}
            setSelectedAccountId={setSelectedAccountId}
            selectedMode={selectedMode}
            setSelectedMode={setSelectedMode}
            linkMode={linkMode}
            setLinkMode={setLinkMode}
            currentAcc={currentAcc}
            currentReviewText={currentReviewText}
            setCurrentReviewText={setCurrentReviewText}
            customReviewInput={customReviewInput}
            setCustomReviewInput={setCustomReviewInput}
            selectedReviewId={selectedReviewId}
            setSelectedReviewId={setSelectedReviewId}
            redirectUrl={redirectUrl}
            setRedirectUrl={setRedirectUrl}
            onAdvanceQueue={handleAdvanceQueue}
            showToast={showToast}
          />
        ) : (
          <DatabaseView
            accounts={accounts}
            reviews={reviews}
            setReviews={setReviews}
            setSelectedAccountId={setSelectedAccountId}
            setSelectedMode={setSelectedMode}
            setSelectedReviewId={setSelectedReviewId}
            setCurrentReviewText={setCurrentReviewText}
            setActiveTab={setActiveTab}
            onResetQueue={handleResetQueue}
            showToast={showToast}
          />
        )}
      </main>

      {/* Floating Toast Notification */}
      {toast && (
        <div className="toast-container">
          <div className="toast">
            <span style={{ color: '#10b981', fontWeight: 'bold' }}>{toast.icon}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
