const { pool, initDb } = require('./_lib/db');
const { requireAdmin } = require('./_lib/auth');
const { readJsonBody } = require('./_lib/http');

module.exports = async (req, res) => {
  try {
    await initDb();
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    if (req.method === 'GET') {
      const result = await pool.query(
        `
        SELECT r.id, r.item_id, i.name AS item_name, r.quantity, r.renter_name,
               r.hire_date, r.return_date, r.price
        FROM rentals r
        JOIN items i ON i.id = r.item_id
        ORDER BY r.hire_date DESC, r.id DESC
        `
      );
      return res.status(200).json(result.rows);
    }

    if (req.method === 'POST') {
      const body = await readJsonBody(req);
      const itemId = Number(body.item_id);
      const quantity = Number(body.quantity);
      const renterName = String(body.renter_name || '').trim() || null;
      const hireDate = String(body.hire_date || '').trim();
      const returnDate = String(body.return_date || '').trim();
      const price = Number(body.price);

      if (!Number.isInteger(itemId) || itemId <= 0) {
        return res.status(400).json({ error: 'Invalid item selected.' });
      }
      if (!Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({ error: 'Quantity must be greater than zero.' });
      }
      if (!hireDate || !returnDate || Number.isNaN(price) || price < 0) {
        return res.status(400).json({ error: 'Invalid rental data.' });
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const itemResult = await client.query('SELECT id, quantity FROM items WHERE id = $1 FOR UPDATE', [itemId]);

        if (itemResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ error: 'Item not found.' });
        }

        const availableQty = Number(itemResult.rows[0].quantity);
        if (availableQty < quantity) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: `Insufficient stock. Available quantity: ${availableQty}.` });
        }

        await client.query('UPDATE items SET quantity = quantity - $1 WHERE id = $2', [quantity, itemId]);

        const rentalResult = await client.query(
          `
          INSERT INTO rentals (item_id, quantity, renter_name, hire_date, return_date, price)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id, item_id, quantity, renter_name, hire_date, return_date, price
          `,
          [itemId, quantity, renterName, hireDate, returnDate, price]
        );

        await client.query('COMMIT');
        return res.status(201).json(rentalResult.rows[0]);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('rentals route error', error);
    return res.status(500).json({ error: 'Rentals request failed.' });
  }
};
