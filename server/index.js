import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initDatabase, db } from './db/nosql.js';
import { authenticateUser, createToken, verifyToken, requireAuth } from './auth.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize NoSQL Database
await initDatabase();

// =====================================================================
// AUTHENTICATION ROUTES (Protects Dashboard)
// =====================================================================

// POST Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const user = authenticateUser(username, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  const token = createToken({ username: user.username, role: user.role });
  res.json({
    success: true,
    token,
    user: {
      username: user.username,
      role: user.role,
    },
  });
});

// GET Verify Auth Token
app.get('/api/auth/verify', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ valid: false, error: 'No token provided' });
  }

  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ valid: false, error: 'Token is invalid or expired' });
  }

  res.json({ valid: true, user });
});

// =====================================================================
// PUBLIC ROUTES (For Review Recipients / Customer Funnel)
// =====================================================================

// Health & DB Status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    database: db.getDbStatus(),
  });
});

// GET Next unposted review for a specific account (Public for dynamic review link)
app.get('/api/reviews/next/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const allReviews = await db.find('reviews', { accountId });
    const unposted = allReviews.filter(r => !r.isPosted);

    if (unposted.length > 0) {
      res.json({ review: unposted[0], remainingUnposted: unposted.length });
    } else {
      res.json({ review: allReviews[0] || null, remainingUnposted: 0 });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Record Review Copied Event (Public for recipient telemetry)
app.post('/api/reviews/copy-event', async (req, res) => {
  try {
    const { reviewId, reviewText, accountId, trigger = 'auto' } = req.body;

    // 1. Log in activity_logs
    const logEntry = await db.insertOne('activity_logs', {
      type: 'copied',
      trigger, // 'auto' | 'manual' | 'submit'
      reviewId: reviewId || null,
      reviewText: (reviewText || '').slice(0, 300),
      accountId: accountId || '',
      timestamp: new Date(),
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    // 2. Update review metadata in NoSQL database
    if (reviewId) {
      const existing = await db.findOne('reviews', { id: reviewId });
      if (existing) {
        await db.updateOne('reviews', { id: reviewId }, {
          lastCopiedAt: new Date(),
          copyCount: (existing.copyCount || 0) + 1,
          status: existing.isPosted ? 'Submitted' : 'Copied'
        });
      }
    }

    res.json({
      success: true,
      message: 'Review copy event recorded',
      logId: logEntry._id
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Record Review Submission (Public for recipient submission)
app.post('/api/reviews/submit', async (req, res) => {
  try {
    const { reviewId, reviewText, accountId } = req.body;

    // 1. Log submission record in submissions collection
    const submissionRecord = await db.insertOne('submissions', {
      reviewId: reviewId || null,
      reviewText: reviewText || '',
      accountId: accountId || '',
      submittedAt: new Date(),
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    // 2. Also record in activity_logs
    await db.insertOne('activity_logs', {
      type: 'submitted',
      reviewId: reviewId || null,
      reviewText: (reviewText || '').slice(0, 300),
      accountId: accountId || '',
      timestamp: new Date(),
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    // 3. Mark review as submitted
    const updatePayload = {
      isPosted: true,
      status: 'Submitted',
      submittedAt: new Date()
    };
    if (reviewId) {
      await db.updateOne('reviews', { id: reviewId }, updatePayload);
    } else if (reviewText) {
      await db.updateOne('reviews', { review: reviewText }, updatePayload);
    }

    // 4. Find next review
    let nextReview = null;
    let remainingUnposted = 0;
    if (accountId) {
      const allReviews = await db.find('reviews', { accountId });
      const unposted = allReviews.filter(r => !r.isPosted);
      nextReview = unposted[0] || null;
      remainingUnposted = unposted.length;
    }

    res.json({
      success: true,
      message: 'Review successfully submitted and marked in NoSQL database',
      submissionId: submissionRecord._id,
      nextReview,
      remainingUnposted
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// =====================================================================
// PROTECTED DASHBOARD ROUTES (Require Admin Token)
// =====================================================================

// GET Accounts with dynamic unposted counters
app.get('/api/accounts', requireAuth, async (req, res) => {
  try {
    const accounts = await db.find('accounts');
    const allReviews = await db.find('reviews');

    const accountsWithStats = accounts.map(acc => {
      const accReviews = allReviews.filter(r => r.accountId === acc.id);
      const unpostedCount = accReviews.filter(r => !r.isPosted).length;
      return {
        ...acc,
        reviewsCount: accReviews.length,
        unpostedCount: unpostedCount,
      };
    });

    res.json(accountsWithStats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Reviews with pagination, filters, and search
app.get('/api/reviews', requireAuth, async (req, res) => {
  try {
    const { account, status, lang, search, page = 1, limit = 10 } = req.query;
    let reviews = await db.find('reviews');

    if (account && account !== 'all') {
      reviews = reviews.filter(r => r.accountId === account);
    }
    if (status === 'unposted') {
      reviews = reviews.filter(r => !r.isPosted);
    } else if (status === 'posted') {
      reviews = reviews.filter(r => r.isPosted);
    }
    if (lang && lang !== 'all') {
      reviews = reviews.filter(r => r.language === lang);
    }
    if (search && search.trim()) {
      const q = search.toLowerCase();
      reviews = reviews.filter(r => 
        (r.review && r.review.toLowerCase().includes(q)) || 
        (r.accountName && r.accountName.toLowerCase().includes(q))
      );
    }

    const total = reviews.length;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = reviews.slice(startIndex, startIndex + limitNum);

    res.json({
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      reviews: paginated,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Manually advance / mark as used
app.post('/api/reviews/advance/:accountId', requireAuth, async (req, res) => {
  try {
    const { accountId } = req.params;
    const { currentReviewId } = req.body;

    if (currentReviewId) {
      await db.updateOne('reviews', { id: currentReviewId }, { isPosted: true, status: 'Used' });
    }

    const allReviews = await db.find('reviews', { accountId });
    const unposted = allReviews.filter(r => !r.isPosted);

    res.json({
      success: true,
      nextReview: unposted[0] || null,
      remainingUnposted: unposted.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Reset submitted queue back to unposted
app.post('/api/reviews/reset', requireAuth, async (req, res) => {
  try {
    await db.updateMany('reviews', {}, { isPosted: false, status: 'Not Posted' });
    res.json({ success: true, message: 'All reviews restored to unposted queue in NoSQL database' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Track link generation
app.post('/api/links/generate', requireAuth, async (req, res) => {
  try {
    const { accountId, url, mode } = req.body;
    const linkDoc = await db.insertOne('links', {
      accountId,
      url,
      mode,
      generatedAt: new Date()
    });
    res.json({ success: true, link: linkDoc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Live Activity Logs (Requires Auth)
app.get('/api/activity', requireAuth, async (req, res) => {
  try {
    const logs = await db.find('activity_logs');
    // Sort newest first
    logs.sort((a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt));
    res.json(logs.slice(0, 50));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// =====================================================================
// FRONTEND SERVING (Production)
// =====================================================================
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

app.use((req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 ReviewFlow Node.js Server running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api/accounts`);
});
