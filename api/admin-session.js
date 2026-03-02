const { initDb } = require('./_lib/db');
const { getAdminFromRequest } = require('./_lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await initDb();
    const admin = await getAdminFromRequest(req);
    if (!admin) {
      return res.status(401).json({ authenticated: false });
    }

    return res.status(200).json({ authenticated: true, email: admin.email });
  } catch (error) {
    console.error('admin-session error', error);
    return res.status(500).json({ error: 'Server error.' });
  }
};
