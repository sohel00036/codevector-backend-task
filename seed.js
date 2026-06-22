const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seedDatabase() {
  console.log('Starting seed process...');
  const startTime = Date.now();

  const categories = ['Electronics', 'Clothing', 'Home', 'Books', 'Beauty'];
  
  const names = [];
  const cats = [];
  const prices = [];
  const timestamps = [];

  for (let i = 1; i <= 200000; i++) {
    names.push(`Product Unique Name ${i}`);
    cats.push(categories[i % categories.length]);
    prices.push((Math.random() * 500 + 5).toFixed(2));
    
    const date = new Date();
    date.setMinutes(date.getMinutes() - i);
    timestamps.push(date);
  }

  try {
    const query = `
      INSERT INTO products (name, category, price, created_at, updated_at)
      SELECT * FROM unnest($1::text[], $2::text[], $3::numeric[], $4::timestamp[], $4::timestamp[])
    `;
    
    await pool.query(query, [names, cats, prices, timestamps]);
    console.log(`Successfully seeded 200,000 products in ${(Date.now() - startTime) / 1000}s`);
  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    await pool.end();
  }
}

seedDatabase();