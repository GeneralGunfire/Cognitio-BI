import { Router } from 'express';
import { pool } from '../db/pool.js';

export const datasetsRouter = Router();

// Scaffold-only: no auth yet, so uploads are attributed to a single
// bootstrap user. Replace with real authenticated user_id once auth exists.
async function getBootstrapUserId() {
  const existing = await pool.query('SELECT id FROM users LIMIT 1');
  if (existing.rows.length > 0) return existing.rows[0].id;

  const inserted = await pool.query(
    'INSERT INTO users (email) VALUES ($1) RETURNING id',
    ['local@bi-platform.dev']
  );
  return inserted.rows[0].id;
}

datasetsRouter.get('/datasets', async (req, res) => {
  const result = await pool.query(
    'SELECT id, name, source_type, created_at FROM datasets ORDER BY created_at DESC'
  );
  res.json(result.rows);
});

// Client parses the file (CSV/Excel) and previews it first; this endpoint
// receives already-parsed rows and the confirmed dataset name/source type.
// No raw file body ever reaches the backend.
datasetsRouter.post('/datasets/confirm-import', async (req, res) => {
  const { name, sourceType, rows } = req.body;

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: '"name" is required.' });
  }
  if (!sourceType || !['csv', 'xlsx'].includes(sourceType)) {
    return res.status(400).json({ error: '"sourceType" must be "csv" or "xlsx".' });
  }
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: '"rows" must be a non-empty array.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userId = await getBootstrapUserId();

    const datasetResult = await client.query(
      `INSERT INTO datasets (user_id, name, source_type)
       VALUES ($1, $2, $3)
       RETURNING id, name, source_type, created_at`,
      [userId, name, sourceType]
    );
    const dataset = datasetResult.rows[0];

    const insertRowText = `
      INSERT INTO dataset_rows (dataset_id, row_index, data)
      VALUES ($1, $2, $3)
    `;
    for (let i = 0; i < rows.length; i++) {
      await client.query(insertRowText, [dataset.id, i, JSON.stringify(rows[i])]);
    }

    await client.query('COMMIT');

    res.status(201).json({
      dataset,
      rowCount: rows.length,
      preview: rows.slice(0, 20),
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Upload failed:', err);
    res.status(500).json({ error: 'Failed to store dataset.' });
  } finally {
    client.release();
  }
});

datasetsRouter.get('/datasets/:id/rows', async (req, res) => {
  const { id } = req.params;
  const limit = Math.min(Number(req.query.limit) || 20, 500);

  const result = await pool.query(
    `SELECT row_index, data FROM dataset_rows
     WHERE dataset_id = $1
     ORDER BY row_index ASC
     LIMIT $2`,
    [id, limit]
  );

  res.json(result.rows.map((r) => r.data));
});
