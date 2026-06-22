const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const DEFAULT_LIMIT = 20;

app.get('/api/products', async (req, res) => {
  try {
    const startTime = performance.now();
    const limit = parseInt(req.query.limit) || DEFAULT_LIMIT;
    const { category, nextCursor } = req.query;

    let queryValues = [];
    const conditions = [];

    // filter by category
    if (category) {
      queryValues.push(category);
      conditions.push(`category = $${queryValues.length}`);
    }

    // handle pagination cursor
    if (nextCursor) {
      try {
        const decodedCursor = Buffer.from(nextCursor, 'base64').toString('ascii');
        const [cursorTime, cursorId] = decodedCursor.split('_');
        
        if (!cursorTime || !cursorId || isNaN(parseInt(cursorId))) {
          throw new Error('Invalid cursor format');
        }

        queryValues.push(new Date(cursorTime), parseInt(cursorId));
        conditions.push(`(created_at, id) < ($${queryValues.length - 1}, $${queryValues.length})`);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid pagination cursor.' });
      }
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const query = `
      SELECT id, name, category, price, created_at 
      FROM products 
      ${whereClause} 
      ORDER BY created_at DESC, id DESC 
      LIMIT $${queryValues.length + 1}
    `;
    
    queryValues.push(limit);
    const { rows } = await pool.query(query, queryValues);

    // generate next cursor string
    let nextCursorString = null;
    if (rows.length === limit) {
      const lastItem = rows[rows.length - 1];
      const rawCursor = `${lastItem.created_at.toISOString()}_${lastItem.id}`;
      nextCursorString = Buffer.from(rawCursor).toString('base64');
    }

    const executionTimeMs = (performance.now() - startTime).toFixed(2);

    res.json({
      meta: {
        count: rows.length,
        executionTime: `${executionTimeMs}ms`
      },
      products: rows,
      nextCursor: nextCursorString
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));