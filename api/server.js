const path = require('path');
const express = require('express');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');

const app = express();

const PORT = Number(process.env.PORT || 3000);
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-this-session-secret-in-production';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'charstinehotelresort@gmail.com').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Resort254/';
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/charstine';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.set('trust proxy', 1);
app.use(
  session({
    store: new pgSession({
      pool,
      tableName: 'session',
      createTableIfMissing: true,
    }),
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 8,
    },
  })
);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
  store: new (require('rate-limit-flexible').RateLimiterMemory)(),
});

function requireAdmin(req, res, next) {
  if (!req.session || !req.session.isAdmin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return next();
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

async function ensureSchemaAndSeed() {
  try {
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
  } catch (error) {
    console.error('Schema initialization error:', error);
  }
}

app.post('/api/login', loginLimiter, async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const result = await pool.query(
      'SELECT id, email, password_hash FROM admin_users WHERE id = 1 AND email = $1 LIMIT 1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const admin = result.rows[0];
    const passwordOk = await bcrypt.compare(password, admin.password_hash);

    if (!passwordOk) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    req.session.isAdmin = true;
    req.session.adminId = admin.id;
    req.session.adminEmail = admin.email;

    return res.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed.' });
  }
});

app.get('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

app.get('/api/admin-session', (req, res) => {
  if (req.session && req.session.isAdmin) {
    return res.json({ authenticated: true, email: req.session.adminEmail });
  }
  return res.status(401).json({ authenticated: false });
});

app.get('/api/inventory', requireAdmin, async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, category, quantity, description FROM items ORDER BY id ASC'
    );
    return res.json(result.rows);
  } catch (error) {
    console.error('Get inventory error:', error);
    return res.status(500).json({ error: 'Failed to load inventory.' });
  }
});

app.post('/api/inventory', requireAdmin, async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const category = String(req.body.category || '').trim();
    const quantity = Number(req.body.quantity);
    const description = String(req.body.description || '').trim();

    if (!name || !category || !Number.isInteger(quantity) || quantity < 0) {
      return res.status(400).json({ error: 'Invalid inventory data.' });
    }

    const result = await pool.query(
      `
      INSERT INTO items (name, category, quantity, description)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, category, quantity, description
      `,
      [name, category, quantity, description]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add inventory error:', error);
    return res.status(500).json({ error: 'Failed to add inventory item.' });
  }
});

app.put('/api/inventory/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const name = String(req.body.name || '').trim();
    const category = String(req.body.category || '').trim();
    const quantity = Number(req.body.quantity);
    const description = String(req.body.description || '').trim();

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid item id.' });
    }

    if (!name || !category || !Number.isInteger(quantity) || quantity < 0) {
      return res.status(400).json({ error: 'Invalid inventory data.' });
    }

    const result = await pool.query(
      `
      UPDATE items
      SET name = $1, category = $2, quantity = $3, description = $4
      WHERE id = $5
      RETURNING id, name, category, quantity, description
      `,
      [name, category, quantity, description, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Update inventory error:', error);
    return res.status(500).json({ error: 'Failed to update inventory item.' });
  }
});

app.delete('/api/inventory/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid item id.' });
    }

    const result = await pool.query('DELETE FROM items WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Delete inventory error:', error);
    return res.status(500).json({ error: 'Failed to delete inventory item.' });
  }
});

app.get('/api/rentals', requireAdmin, async (_req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT r.id, r.item_id, i.name AS item_name, r.quantity, r.renter_name,
             r.hire_date, r.return_date, r.price
      FROM rentals r
      JOIN items i ON i.id = r.item_id
      ORDER BY r.hire_date DESC, r.id DESC
      `
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('Get rentals error:', error);
    return res.status(500).json({ error: 'Failed to load rentals.' });
  }
});

app.post('/api/rentals', requireAdmin, async (req, res) => {
  const client = await pool.connect();

  try {
    const itemId = Number(req.body.item_id);
    const quantity = Number(req.body.quantity);
    const renterName = String(req.body.renter_name || '').trim() || null;
    const hireDate = String(req.body.hire_date || '').trim();
    const returnDate = String(req.body.return_date || '').trim();
    const price = Number(req.body.price);

    if (!Number.isInteger(itemId) || itemId <= 0) {
      return res.status(400).json({ error: 'Invalid item selected.' });
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ error: 'Quantity must be greater than zero.' });
    }

    if (!hireDate || !returnDate || Number.isNaN(price) || price < 0) {
      return res.status(400).json({ error: 'Invalid rental data.' });
    }

    await client.query('BEGIN');

    const itemResult = await client.query(
      'SELECT id, quantity FROM items WHERE id = $1 FOR UPDATE',
      [itemId]
    );

    if (itemResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Item not found.' });
    }

    const availableQty = Number(itemResult.rows[0].quantity);
    if (availableQty < quantity) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `Insufficient stock. Available quantity: ${availableQty}.`,
      });
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
    console.error('Create rental error:', error);
    return res.status(500).json({ error: 'Failed to log rental.' });
  } finally {
    client.release();
  }
});

app.get('/api/reports', requireAdmin, async (_req, res) => {
  try {
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

    return res.json({
      daily: daily.rows,
      weekly: weekly.rows,
    });
  } catch (error) {
    console.error('Report error:', error);
    return res.status(500).json({ error: 'Failed to load reports.' });
  }
});

app.get('/api/admin-dashboard.html', (req, res) => {
  if (!req.session || !req.session.isAdmin) {
    return res.redirect('/admin-access.html');
  }
  return res.sendFile(path.join(__dirname, '../admin-dashboard.html'));
});

app.get('/api/admin-login.html', (req, res) => {
  if (req.session && req.session.isAdmin) {
    return res.redirect('/admin-dashboard.html');
  }
  return res.sendFile(path.join(__dirname, '../admin-access.html'));
});

app.use(express.static(path.join(__dirname, '..')));

app.use((err, _req, res, _next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

async function startServer() {
  try {
    await ensureSchemaAndSeed();
    console.log('Database schema initialized');
  } catch (error) {
    console.error('Failed to initialize schema:', error);
  }
}

startServer();

module.exports = app;
