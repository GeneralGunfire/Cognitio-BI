import { Router } from 'express';
import { pool } from '../db/pool.js';
import { SUPPORTED_OPERATIONS } from '../transforms/engine.js';
import { getSteps, getTransformedRows } from '../transforms/resolve.js';

export const transformsRouter = Router();

transformsRouter.get('/datasets/:id/transform-steps', async (req, res) => {
  const steps = await getSteps(req.params.id);
  res.json(steps);
});

transformsRouter.post('/datasets/:id/transform-steps', async (req, res) => {
  const datasetId = req.params.id;
  const { operation_type, params } = req.body;

  if (!operation_type || !SUPPORTED_OPERATIONS.includes(operation_type)) {
    return res.status(400).json({
      error: `"operation_type" must be one of: ${SUPPORTED_OPERATIONS.join(', ')}`,
    });
  }

  const orderResult = await pool.query(
    `SELECT COALESCE(MAX(step_order), -1) + 1 AS next_order
     FROM transform_steps WHERE dataset_id = $1`,
    [datasetId]
  );
  const nextOrder = orderResult.rows[0].next_order;

  const inserted = await pool.query(
    `INSERT INTO transform_steps (dataset_id, step_order, operation_type, params)
     VALUES ($1, $2, $3, $4)
     RETURNING id, dataset_id, step_order, operation_type, params, created_at`,
    [datasetId, nextOrder, operation_type, JSON.stringify(params || {})]
  );

  res.status(201).json(inserted.rows[0]);
});

transformsRouter.delete('/datasets/:id/transform-steps/:stepId', async (req, res) => {
  const { id: datasetId, stepId } = req.params;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const deleted = await client.query(
      `DELETE FROM transform_steps WHERE id = $1 AND dataset_id = $2 RETURNING step_order`,
      [stepId, datasetId]
    );

    if (deleted.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Step not found.' });
    }

    const removedOrder = deleted.rows[0].step_order;
    await client.query(
      `UPDATE transform_steps SET step_order = step_order - 1
       WHERE dataset_id = $1 AND step_order > $2`,
      [datasetId, removedOrder]
    );

    await client.query('COMMIT');
    res.status(204).send();
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to delete step:', err);
    res.status(500).json({ error: 'Failed to delete step.' });
  } finally {
    client.release();
  }
});

// Reorders steps according to the given array of step ids (new order).
transformsRouter.patch('/datasets/:id/transform-steps/reorder', async (req, res) => {
  const datasetId = req.params.id;
  const { step_ids } = req.body;

  if (!Array.isArray(step_ids) || step_ids.length === 0) {
    return res.status(400).json({ error: '"step_ids" must be a non-empty array.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (let i = 0; i < step_ids.length; i++) {
      await client.query(
        `UPDATE transform_steps SET step_order = $1 WHERE id = $2 AND dataset_id = $3`,
        [i, step_ids[i], datasetId]
      );
    }

    await client.query('COMMIT');
    const steps = await getSteps(datasetId);
    res.json(steps);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to reorder steps:', err);
    res.status(500).json({ error: 'Failed to reorder steps.' });
  } finally {
    client.release();
  }
});

transformsRouter.get('/datasets/:id/transformed-view', async (req, res) => {
  const datasetId = req.params.id;
  const limit = Math.min(Number(req.query.limit) || 20, 500);

  try {
    const transformed = await getTransformedRows(datasetId);

    res.json({
      rowCount: transformed.length,
      rows: transformed.slice(0, limit),
    });
  } catch (err) {
    console.error('Failed to compute transformed view:', err);
    res.status(500).json({ error: err.message || 'Failed to compute transformed view.' });
  }
});
