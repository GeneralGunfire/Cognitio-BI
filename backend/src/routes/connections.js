import { Router } from 'express';
import pg from 'pg';
import mysql from 'mysql2/promise';
import { pool } from '../db/pool.js';
import { encrypt, decrypt } from '../crypto/encryption.js';

export const connectionsRouter = Router();

const CONNECTION_TYPES = ['postgres', 'mysql'];

// Opens a short-lived connection to the external source, runs `run`, then
// always closes it. No connection pool is held open per dataset.
async function withExternalConnection(connection, run) {
  const { connection_type, host, port, database_name, username, encrypted_password } = connection;
  const password = decrypt(encrypted_password);

  if (connection_type === 'postgres') {
    const client = new pg.Client({ host, port, database: database_name, user: username, password });
    await client.connect();
    try {
      return await run((sql) => client.query(sql));
    } finally {
      await client.end();
    }
  }

  if (connection_type === 'mysql') {
    const conn = await mysql.createConnection({ host, port, database: database_name, user: username, password });
    try {
      return await run(async (sql) => {
        const [rows] = await conn.query(sql);
        return { rows };
      });
    } finally {
      await conn.end();
    }
  }

  throw new Error(`Unsupported connection_type: ${connection_type}`);
}

// Fetches a data_connection's live rows, running its query_definition
// against the external source. Shared by the live-data route and by
// resolve.js so direct_query datasets replay transforms on top of the same
// freshly-fetched rows without duplicating connection logic.
export async function fetchLiveRows(connection) {
  return withExternalConnection(connection, async (query) => {
    const queryText = /^[a-zA-Z0-9_."]+$/.test(connection.query_definition.trim())
      ? `SELECT * FROM ${connection.query_definition.trim()}`
      : connection.query_definition;
    const { rows } = await query(queryText);
    return rows;
  });
}

export async function getConnectionForDataset(datasetId) {
  const result = await pool.query('SELECT * FROM data_connections WHERE dataset_id = $1', [datasetId]);
  return result.rows[0] || null;
}

function validateConnectionBody(body) {
  const { connectionType, host, port, databaseName, username, password, queryDefinition } = body;
  if (!CONNECTION_TYPES.includes(connectionType)) {
    return `"connectionType" must be one of: ${CONNECTION_TYPES.join(', ')}`;
  }
  if (!host || typeof host !== 'string') return '"host" is required.';
  if (!port || !Number.isInteger(Number(port))) return '"port" must be an integer.';
  if (!databaseName || typeof databaseName !== 'string') return '"databaseName" is required.';
  if (!username || typeof username !== 'string') return '"username" is required.';
  if (!password || typeof password !== 'string') return '"password" is required.';
  if (!queryDefinition || typeof queryDefinition !== 'string') return '"queryDefinition" is required.';
  return null;
}

// Creates a data_connection for an existing dataset and marks it as
// source_mode = 'direct_query'. The dataset must already exist (created via
// the normal datasets flow, or a lightweight direct_query dataset created
// up front by the caller) — this endpoint only attaches connection details.
connectionsRouter.post('/datasets/:id/connection', async (req, res) => {
  const { id } = req.params;
  const validationError = validateConnectionBody(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const { connectionType, host, port, databaseName, username, password, queryDefinition } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const datasetResult = await client.query('SELECT id FROM datasets WHERE id = $1', [id]);
    if (datasetResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Dataset not found.' });
    }

    await client.query(`UPDATE datasets SET source_mode = 'direct_query' WHERE id = $1`, [id]);

    const encryptedPassword = encrypt(password);
    const inserted = await client.query(
      `INSERT INTO data_connections
         (dataset_id, connection_type, host, port, database_name, username, encrypted_password, query_definition)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, dataset_id, connection_type, host, port, database_name, username, query_definition, created_at`,
      [id, connectionType, host, Number(port), databaseName, username, encryptedPassword, queryDefinition]
    );

    await client.query('COMMIT');
    res.status(201).json(inserted.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to create connection:', err);
    res.status(500).json({ error: 'Failed to create connection.' });
  } finally {
    client.release();
  }
});

// Attempts to connect to the external source and run a trivial query.
// Never returns actual data rows — success/failure only.
connectionsRouter.post('/datasets/:id/connection/test', async (req, res) => {
  const { id } = req.params;

  const connection = await getConnectionForDataset(id);
  if (!connection) {
    return res.status(404).json({ error: 'No connection configured for this dataset.' });
  }

  try {
    await withExternalConnection(connection, async (query) => {
      await query('SELECT 1');
    });
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// Runs the connection's stored query_definition live against the external
// source and returns the rows directly. Nothing is written to our database.
connectionsRouter.get('/datasets/:id/live-data', async (req, res) => {
  const { id } = req.params;

  const connection = await getConnectionForDataset(id);
  if (!connection) {
    return res.status(404).json({ error: 'No connection configured for this dataset.' });
  }

  try {
    const rows = await fetchLiveRows(connection);
    res.json({ rows });
  } catch (err) {
    console.error('Live query failed:', err);
    res.status(502).json({ error: `Failed to fetch live data: ${err.message}` });
  }
});
