const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/charstine';
const MIGRATION_SECRET = process.env.MIGRATION_SECRET || 'migrate-charstine-items-2026';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const ITEMS = [
  // Kitchen Inventory Items
  { id: 1, name: 'Large white plastic plates', category: 'Kitchen Inventory', quantity: 35, description: 'Large serving plastic plates' },
  { id: 2, name: 'Plastic plates', category: 'Kitchen Inventory', quantity: 109, description: 'Standard plastic plates' },
  { id: 3, name: 'Aluminium plates', category: 'Kitchen Inventory', quantity: 50, description: 'Metal plates' },
  { id: 4, name: 'Plastic cups', category: 'Kitchen Inventory', quantity: 133, description: 'Drinking plastic cups' },
  { id: 5, name: 'Jugs', category: 'Kitchen Inventory', quantity: 2, description: 'Water serving jugs' },
  { id: 6, name: 'Aluminium jug', category: 'Kitchen Inventory', quantity: 1, description: 'Metal water jug' },
  { id: 7, name: 'Sufurias', category: 'Kitchen Inventory', quantity: 25, description: 'Cooking pots' },
  { id: 8, name: 'Filters', category: 'Kitchen Inventory', quantity: 4, description: 'Liquid filtering tools' },
  { id: 9, name: 'Plastic spoons', category: 'Kitchen Inventory', quantity: 59, description: 'Plastic serving spoons' },
  { id: 10, name: 'Aluminium spoons', category: 'Kitchen Inventory', quantity: 127, description: 'Metal spoons' },
  { id: 11, name: 'Serving spoons', category: 'Kitchen Inventory', quantity: 9, description: 'Food serving spoons' },
  { id: 12, name: 'Thong', category: 'Kitchen Inventory', quantity: 4, description: 'Food handling tongs' },
  { id: 13, name: 'Thermos', category: 'Kitchen Inventory', quantity: 3, description: 'Heat retaining containers' },
  { id: 14, name: 'Washing hand tank', category: 'Kitchen Inventory', quantity: 1, description: 'Hand washing tank' },
  { id: 15, name: 'Buckets', category: 'Kitchen Inventory', quantity: 15, description: 'Water buckets' },
  { id: 16, name: 'Sina', category: 'Kitchen Inventory', quantity: 4, description: 'Storage container' },
  { id: 17, name: 'Catering savers (big)', category: 'Kitchen Inventory', quantity: 13, description: 'Large food storage containers' },
  { id: 18, name: 'Catering savers (small)', category: 'Kitchen Inventory', quantity: 7, description: 'Small food storage containers' },
  { id: 19, name: 'Karai', category: 'Kitchen Inventory', quantity: 3, description: 'Cooking frying pan' },
  { id: 20, name: 'Hotpot', category: 'Kitchen Inventory', quantity: 2, description: 'Food heat containers' },
  { id: 21, name: 'Pan', category: 'Kitchen Inventory', quantity: 4, description: 'Cooking pan' },
  { id: 22, name: 'Roller', category: 'Kitchen Inventory', quantity: 4, description: 'Dough rolling pin' },
  { id: 23, name: 'Chopping board', category: 'Kitchen Inventory', quantity: 4, description: 'Cutting board' },
  { id: 24, name: 'Chapati rolling board', category: 'Kitchen Inventory', quantity: 4, description: 'Chapati preparation board' },
  { id: 25, name: 'Bowls', category: 'Kitchen Inventory', quantity: 25, description: 'Food serving bowls' },
  { id: 26, name: 'Melamine cups', category: 'Kitchen Inventory', quantity: 23, description: 'Hard plastic cups' },
  { id: 27, name: 'Small melamine cups', category: 'Kitchen Inventory', quantity: 26, description: 'Small hard plastic cups' },
  { id: 28, name: 'Saucers', category: 'Kitchen Inventory', quantity: 6, description: 'Cup saucers' },
  { id: 29, name: 'Side plates', category: 'Kitchen Inventory', quantity: 38, description: 'Small plates' },
  { id: 30, name: 'Aluminium portion plates', category: 'Kitchen Inventory', quantity: 20, description: 'Metal portion plates' },
  { id: 31, name: 'Hard melamine plates', category: 'Kitchen Inventory', quantity: 34, description: 'Durable melamine plates' },
  { id: 32, name: 'Pilipili bowls', category: 'Kitchen Inventory', quantity: 3, description: 'Small chili bowls' },
  { id: 33, name: 'Fish plates', category: 'Kitchen Inventory', quantity: 3, description: 'Plates for fish serving' },
  { id: 34, name: 'Portion plates', category: 'Kitchen Inventory', quantity: 5, description: 'Food portion plates' },
  { id: 35, name: 'Knives', category: 'Kitchen Inventory', quantity: 6, description: 'Cutting knives' },
  { id: 36, name: 'Big bowls', category: 'Kitchen Inventory', quantity: 2, description: 'Large bowls' },
  { id: 37, name: 'Kamata', category: 'Kitchen Inventory', quantity: 2, description: 'Food handling utensil' },
  { id: 38, name: 'Scouping spoon', category: 'Kitchen Inventory', quantity: 1, description: 'Large scooping spoon' },
  
  // Restaurant Inventory Items
  { id: 39, name: 'Pilipili bowls', category: 'Restaurant Inventory', quantity: 5, description: 'Chili serving bowls' },
  { id: 40, name: 'Cups', category: 'Restaurant Inventory', quantity: 11, description: 'Drinking cups' },
  { id: 41, name: 'Saucers', category: 'Restaurant Inventory', quantity: 8, description: 'Cup saucers' },
  { id: 42, name: 'Jugs', category: 'Restaurant Inventory', quantity: 3, description: 'Serving jugs' },
  { id: 43, name: 'Spoons', category: 'Restaurant Inventory', quantity: 130, description: 'Eating spoons' },
  { id: 44, name: 'Forks', category: 'Restaurant Inventory', quantity: 39, description: 'Eating forks' },
  { id: 45, name: 'Eating knives', category: 'Restaurant Inventory', quantity: 11, description: 'Table knives' },
  { id: 46, name: 'Gold spoons', category: 'Restaurant Inventory', quantity: 12, description: 'Premium spoons' },
  { id: 47, name: 'Small tea spoons', category: 'Restaurant Inventory', quantity: 6, description: 'Small stirring spoons' },
  { id: 48, name: 'Teaspoons', category: 'Restaurant Inventory', quantity: 8, description: 'Tea stirring spoons' },
  { id: 49, name: 'Grater', category: 'Restaurant Inventory', quantity: 1, description: 'Food grating tool' },
  { id: 50, name: 'Sugar dish (small)', category: 'Restaurant Inventory', quantity: 4, description: 'Small sugar container' },
  { id: 51, name: 'Sugar dish (big)', category: 'Restaurant Inventory', quantity: 2, description: 'Large sugar container' },
  { id: 52, name: 'Tea pots', category: 'Restaurant Inventory', quantity: 9, description: 'Tea serving pots' },
  { id: 53, name: 'Trays', category: 'Restaurant Inventory', quantity: 4, description: 'Serving trays' },
  { id: 54, name: 'Glasses (big)', category: 'Restaurant Inventory', quantity: 2, description: 'Large drinking glasses' },
  { id: 55, name: 'Glasses (small)', category: 'Restaurant Inventory', quantity: 8, description: 'Small drinking glasses' },
  { id: 56, name: 'Wine glasses', category: 'Restaurant Inventory', quantity: 2, description: 'Wine serving glasses' },
  { id: 57, name: 'Kamata', category: 'Restaurant Inventory', quantity: 1, description: 'Food handling utensil' },
];

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // Verify the migration secret
  const secret = req.headers['x-migration-secret'] || req.body.secret;
  if (secret !== MIGRATION_SECRET) {
    return res.status(401).json({ error: 'Unauthorized. Invalid migration secret.' });
  }

  const client = await pool.connect();

  try {
    // Start transaction
    await client.query('BEGIN');

    // Delete existing items (optional - comment out if you want to keep existing items)
    // await client.query('DELETE FROM items WHERE id >= 1 AND id <= 57');

    // Insert all items
    let insertedCount = 0;
    for (const item of ITEMS) {
      try {
        await client.query(
          `INSERT INTO items (id, name, category, quantity, description)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO UPDATE
           SET name = EXCLUDED.name,
               category = EXCLUDED.category,
               quantity = EXCLUDED.quantity,
               description = EXCLUDED.description`,
          [item.id, item.name, item.category, item.quantity, item.description]
        );
        insertedCount++;
      } catch (itemError) {
        console.error(`Error inserting item ${item.id}:`, itemError);
      }
    }

    // Update the sequence
    await client.query('SELECT setval(\'items_id_seq\', (SELECT MAX(id) FROM items))');

    // Commit transaction
    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: `Successfully migrated ${insertedCount} inventory items.`,
      itemsCount: insertedCount,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration error:', error);
    return res.status(500).json({ error: 'Migration failed.', details: error.message });
  } finally {
    client.release();
  }
};
