const { pool, initDb } = require('./_lib/db');
const { requireAdmin } = require('./_lib/auth');
const { readJsonBody } = require('./_lib/http');

module.exports = async (req, res) => {
  try {
    await initDb();
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    if (req.method === 'GET') {
      const result = await pool.query('SELECT id, name, category, quantity, description FROM items ORDER BY id ASC');
      return res.status(200).json(result.rows);
    }

    if (req.method === 'POST') {
      const body = await readJsonBody(req);
      const name = String(body.name || '').trim();
      const category = String(body.category || '').trim();
      const quantity = Number(body.quantity);
      const description = String(body.description || '').trim();

      if (!name || !category || !Number.isInteger(quantity) || quantity < 0) {
        return res.status(400).json({ error: 'Invalid inventory data.' });
      }

      const result = await pool.query(
        'INSERT INTO items (name, category, quantity, description) VALUES ($1, $2, $3, $4) RETURNING id, name, category, quantity, description',
        [name, category, quantity, description]
      );

      return res.status(201).json(result.rows[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('inventory route error', error);
    return res.status(500).json({ error: 'Inventory request failed.' });
  }
};
