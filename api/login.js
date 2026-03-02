const bcrypt = require('bcryptjs');
const { pool, initDb } = require('./_lib/db');
const { createSession, setSessionCookie } = require('./_lib/auth');
const { readJsonBody } = require('./_lib/http');

const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function getIp(req) {
  return (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').toString();
}

function isRateLimited(ip) {
  const now = Date.now();
  const state = attempts.get(ip) || { count: 0, resetAt: now + WINDOW_MS };

  if (now > state.resetAt) {
    state.count = 0;
    state.resetAt = now + WINDOW_MS;
  }

  state.count += 1;
  attempts.set(ip, state);

  return state.count > MAX_ATTEMPTS;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await initDb();

    const ip = getIp(req);
    if (isRateLimited(ip)) {
      return res.status(429).json({ error: 'Too many login attempts. Try again in 15 minutes.' });
    }

    const body = await readJsonBody(req);
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const result = await pool.query(
      'SELECT id, email, password_hash FROM admin_users WHERE id = 1 AND email = $1 LIMIT 1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const admin = result.rows[0];
    const ok = await bcrypt.compare(password, admin.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const sessionId = await createSession(admin.id);
    setSessionCookie(res, sessionId);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('login error', error);
    if (String(error.message || '').includes('DATABASE_URL is not configured')) {
      return res.status(500).json({ error: 'DATABASE_URL is missing in Vercel environment variables.' });
    }
    return res.status(500).json({ error: 'Server error during login.' });
  }
};
