const crypto = require('crypto');
const { pool } = require('./db');

const SESSION_SECRET = process.env.SESSION_SECRET || 'change-this-session-secret-in-production';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

function parseCookies(req) {
  const cookieHeader = req.headers.cookie || '';
  const cookies = {};

  cookieHeader.split(';').forEach((pair) => {
    const [rawKey, ...rawValue] = pair.trim().split('=');
    if (!rawKey) return;
    cookies[rawKey] = decodeURIComponent(rawValue.join('='));
  });

  return cookies;
}

function sign(sessionId) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(sessionId).digest('hex');
}

function setSessionCookie(res, sessionId) {
  const signature = sign(sessionId);
  const value = `${sessionId}.${signature}`;
  const secure = process.env.NODE_ENV === 'production';
  const cookie = `admin_session=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SECONDS}${secure ? '; Secure' : ''}`;
  res.setHeader('Set-Cookie', cookie);
}

function clearSessionCookie(res) {
  const secure = process.env.NODE_ENV === 'production';
  const cookie = `admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? '; Secure' : ''}`;
  res.setHeader('Set-Cookie', cookie);
}

async function createSession(adminId) {
  const sessionId = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  await pool.query(
    `INSERT INTO admin_sessions (id, admin_id, expires_at) VALUES ($1, $2, $3)`,
    [sessionId, adminId, expiresAt]
  );
  return sessionId;
}

async function getAdminFromRequest(req) {
  const cookies = parseCookies(req);
  const packed = cookies.admin_session;
  if (!packed) return null;

  const [sessionId, signature] = packed.split('.');
  if (!sessionId || !signature) return null;
  if (sign(sessionId) !== signature) return null;

  const result = await pool.query(
    `
    SELECT u.id, u.email
    FROM admin_sessions s
    JOIN admin_users u ON u.id = s.admin_id
    WHERE s.id = $1 AND s.expires_at > NOW()
    LIMIT 1
    `,
    [sessionId]
  );

  if (result.rows.length === 0) return null;
  return { ...result.rows[0], sessionId };
}

async function destroySession(req, res) {
  const admin = await getAdminFromRequest(req);
  if (admin && admin.sessionId) {
    await pool.query('DELETE FROM admin_sessions WHERE id = $1', [admin.sessionId]);
  }
  clearSessionCookie(res);
}

async function requireAdmin(req, res) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  return admin;
}

module.exports = {
  createSession,
  setSessionCookie,
  clearSessionCookie,
  getAdminFromRequest,
  destroySession,
  requireAdmin,
};
