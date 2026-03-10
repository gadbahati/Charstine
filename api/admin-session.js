const AUTH_COOKIE = 'charstine_admin_ok';

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const cookie = String(req.headers.cookie || '');
    const ok = cookie.split(';').some((row) => row.trim().startsWith(`${AUTH_COOKIE}=1`));

    if (!ok) {
      return res.status(401).json({ authenticated: false });
    }

    return res.status(200).json({ authenticated: true, email: 'charstinehotelresort@gmail.com' });
  } catch (error) {
    console.error('admin-session error', error);
    return res.status(500).json({ error: 'Session check failed.' });
  }
};
