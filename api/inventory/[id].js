const { pool, initDb } = require('../_lib/db');
const { requireAdmin } = require('../_lib/auth');
const { readJsonBody } = require('../_lib/http');

module.exports = async (req, res) => {
  try {
    await initDb();
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const id = Number(req.query.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid item id.' });
    }

    if (req.method === 'PUT') {
      const body = await readJsonBody(req);
      const name = String(body.name || '').trim();
      const category = String(body.category || '').trim();
      const quantity = Number(body.quantity);
      const description = String(body.description || '').trim();

      if (!name || !category || !Number.isInteger(quantity) || quantity < 0) {
        return res.status(400).json({ error: 'Invalid inventory data.' });
      }

      const result = await pool.query(
        'UPDATE items SET name = $1, category = $2, quantity = $3, description = $4 WHERE id = $5 RETURNING id, name, category, quantity, description',
        [name, category, quantity, description, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Item not found.' });
      }

      return res.status(200).json(result.rows[0]);
    }

    if (req.method === 'DELETE') {
      const result = await pool.query('DELETE FROM items WHERE id = $1 RETURNING id', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Item not found.' });
      }
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('inventory id route error', error);
    return res.status(500).json({ error: 'Inventory request failed.' });
  }
};
