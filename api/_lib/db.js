const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const DATABASE_URL = process.env.DATABASE_URL;
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'Charstinehoteltourist@gmail.com').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Resort254';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

let initPromise;

async function initDb() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (!DATABASE_URL) {
      throw new Error('DATABASE_URL is not configured.');
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity >= 0),
        description TEXT DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS rentals (
        id SERIAL PRIMARY KEY,
        item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        renter_name TEXT,
        hire_date DATE NOT NULL,
        return_date DATE NOT NULL,
        price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS admin_sessions (
        id TEXT PRIMARY KEY,
        admin_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);
    `);

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    await pool.query(
      `
      INSERT INTO admin_users (id, email, password_hash)
      VALUES (1, $1, $2)
      ON CONFLICT (id)
      DO UPDATE SET email = EXCLUDED.email, password_hash = EXCLUDED.password_hash
      `,
      [ADMIN_EMAIL, passwordHash]
    );
    await pool.query('DELETE FROM admin_users WHERE id <> 1');

    await pool.query(`
      INSERT INTO items (name, category, quantity, description)
      SELECT * FROM (VALUES
        ('Dining Table', 'Restaurant', 10, 'Wooden tables for dining'),
        ('Chair Set', 'Restaurant', 20, 'Comfortable dining chairs'),
        ('Tent', 'Hall', 5, 'Large event tents'),
        ('Projector', 'ICT', 3, 'Hall projector'),
        ('Laptop', 'ICT', 8, 'Admin laptops'),
        ('Bed', 'Beds', 20, 'King-size beds'),
        ('Plate Set', 'Utensils', 50, 'Dinner plate set'),
        ('Spoon Set', 'Utensils', 100, 'Stainless steel spoons'),
        ('Cleaning Cart', 'Store', 5, 'Storage and housekeeping cart'),
        ('Speaker System', 'Hall', 2, 'For hall events')
      ) AS seed(name, category, quantity, description)
      WHERE NOT EXISTS (SELECT 1 FROM items);
    `);
  })();

  return initPromise;
}

module.exports = {
  pool,
  initDb,
};
