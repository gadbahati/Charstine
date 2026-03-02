const { pool, initDb } = require('./_lib/db');
const { requireAdmin } = require('./_lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await initDb();
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const daily = await pool.query(
      `
      SELECT hire_date::date AS period,
             COUNT(*)::int AS rentals_count,
             COALESCE(SUM(price), 0)::numeric AS total_revenue
      FROM rentals
      GROUP BY hire_date::date
      ORDER BY period DESC
      LIMIT 7
      `
    );

    const weekly = await pool.query(
      `
      SELECT DATE_TRUNC('week', hire_date)::date AS period,
             COUNT(*)::int AS rentals_count,
             COALESCE(SUM(price), 0)::numeric AS total_revenue
      FROM rentals
      GROUP BY DATE_TRUNC('week', hire_date)
      ORDER BY period DESC
      LIMIT 8
      `
    );

    return res.status(200).json({ daily: daily.rows, weekly: weekly.rows });
  } catch (error) {
    console.error('reports route error', error);
    return res.status(500).json({ error: 'Reports request failed.' });
  }
};
