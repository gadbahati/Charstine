CREATE EXTENSION IF NOT EXISTS pgcrypto;

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

INSERT INTO admin_users (id, email, password_hash)
VALUES (
  1,
  'Charstinehoteltourist@gmail.com',
  crypt('Resort254', gen_salt('bf', 12))
)
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash;

SELECT setval('admin_users_id_seq', (SELECT MAX(id) FROM admin_users));

INSERT INTO items (id, name, category, quantity, description) VALUES
  (1, 'Dining Table', 'Restaurant', 10, 'Wooden tables for dining'),
  (2, 'Chair Set', 'Restaurant', 20, 'Comfortable dining chairs'),
  (3, 'Tent', 'Hall', 5, 'Large event tents'),
  (4, 'Projector', 'ICT', 3, 'Hall projector'),
  (5, 'Laptop', 'ICT', 8, 'Admin laptops'),
  (6, 'Bed', 'Beds', 20, 'King-size beds'),
  (7, 'Plate Set', 'Utensils', 50, 'Dinner plate set'),
  (8, 'Spoon Set', 'Utensils', 100, 'Stainless steel spoons'),
  (9, 'Cleaning Cart', 'Store', 5, 'Storage and housekeeping'),
  (10, 'Speaker System', 'Hall', 2, 'For hall events')
ON CONFLICT (id) DO NOTHING;

SELECT setval('items_id_seq', (SELECT MAX(id) FROM items));
