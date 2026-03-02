const { initDb } = require('./_lib/db');
const { destroySession } = require('./_lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await initDb();
    await destroySession(req, res);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('logout error', error);
    return res.status(500).json({ error: 'Server error during logout.' });
  }
};
