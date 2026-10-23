import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'webworks-super-secret-key-2026';
const ADMIN_USER = (process.env.ADMIN_USERNAME || 'review_admin').trim();
const ADMIN_PASS = (process.env.ADMIN_PASSWORD || 'WebWorks@Admin2026!').trim();

// Create a secure signed token
export function createToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

// Verify a signed token
export function verifyToken(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  if (signature !== expectedSig) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Expired
    }
    return payload;
  } catch (e) {
    return null;
  }
}

// Validate credentials
export function authenticateUser(username, password) {
  const normalizedUser = (username || '').trim().toLowerCase();
  const targetUser = ADMIN_USER.toLowerCase();

  if (normalizedUser === targetUser && password === ADMIN_PASS) {
    return {
      username: ADMIN_USER,
      role: 'admin',
    };
  }
  return null;
}

// Express Middleware to protect dashboard endpoints
export function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Access denied. Authentication token required.' });
  }

  const user = verifyToken(token);
  if (!user) {
    return res.status(403).json({ error: 'Invalid or expired authentication token.' });
  }

  req.user = user;
  next();
}
