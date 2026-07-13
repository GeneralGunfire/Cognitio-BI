import { pool } from '../db/pool.js';
import { replaySteps } from './engine.js';
import { fetchLiveRows, getConnectionForDataset } from '../routes/connections.js';

// Shared by the transforms routes and the dashboard/chart routes so both
// resolve a dataset's "current" transformed view the same way.

async function getDataset(datasetId) {
  const result = await pool.query(
    `SELECT id, source_mode FROM datasets WHERE id = $1`,
    [datasetId]
  );
  return result.rows[0] || null;
}

export async function getOriginalRows(datasetId) {
  const result = await pool.query(
    `SELECT data FROM dataset_rows WHERE dataset_id = $1 ORDER BY row_index ASC`,
    [datasetId]
  );
  return result.rows.map((r) => r.data);
}

// For direct_query datasets, "original rows" are fetched live from the
// external source on every call — nothing is persisted here or anywhere
// else, per the DirectQuery governance rule.
export async function getBaseRows(datasetId) {
  const dataset = await getDataset(datasetId);
  if (!dataset) {
    throw new Error('Dataset not found.');
  }

  if (dataset.source_mode === 'direct_query') {
    const connection = await getConnectionForDataset(datasetId);
    if (!connection) {
      throw new Error('No connection configured for this dataset.');
    }
    return fetchLiveRows(connection);
  }

  return getOriginalRows(datasetId);
}

export async function getSteps(datasetId) {
  const result = await pool.query(
    `SELECT id, dataset_id, step_order, operation_type, params, created_at
     FROM transform_steps WHERE dataset_id = $1 ORDER BY step_order ASC`,
    [datasetId]
  );
  return result.rows;
}

export async function getTransformedRows(datasetId) {
  const [baseRows, steps] = await Promise.all([
    getBaseRows(datasetId),
    getSteps(datasetId),
  ]);
  return replaySteps(baseRows, steps);
}
