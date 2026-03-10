const { readJsonBody } = require('./_lib/http');

const ADMIN_EMAIL = 'charstinehotelresort@gmail.com';
const ADMIN_PASSWORD = 'Resort254/';
const AUTH_COOKIE = 'charstine_admin_ok';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = await readJsonBody(req);
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase() || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const secure = process.env.NODE_ENV === 'production';
    res.setHeader(
      'Set-Cookie',
      `${AUTH_COOKIE}=1; Path=/; HttpOnly; SameSite=Lax; Max-Age=28800${secure ? '; Secure' : ''}`
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('login error', error);
    return res.status(500).json({ error: 'Login failed.' });
  }
};
