import { Router } from 'express';
import { randomBytes } from 'crypto';
import { pool } from '../db/pool.js';
import { getTransformedRows } from '../transforms/resolve.js';

export const sharesRouter = Router();

function generateShareToken() {
  return randomBytes(32).toString('hex'); // 64 chars, unguessable
}

// Rejects sharing if any chart on the dashboard reads from a direct_query
// dataset — DirectQuery row data must never be exposed via an unauthenticated
// public link at this stage. Returns the offending chart count, or null if
// the dashboard is fully import-mode and safe to share.
async function findDirectQueryChartCount(dashboardId) {
  const result = await pool.query(
    `SELECT COUNT(*)::int AS count
     FROM charts c
     JOIN datasets d ON d.id = c.dataset_id
     WHERE c.dashboard_id = $1 AND d.source_mode = 'direct_query'`,
    [dashboardId]
  );
  return result.rows[0].count;
}

sharesRouter.post('/dashboards/:id/shares', async (req, res) => {
  const dashboardId = req.params.id;

  const dashboardResult = await pool.query('SELECT id FROM dashboards WHERE id = $1', [dashboardId]);
  if (dashboardResult.rows.length === 0) {
    return res.status(404).json({ error: 'Dashboard not found.' });
  }

  const directQueryCount = await findDirectQueryChartCount(dashboardId);
  if (directQueryCount > 0) {
    return res.status(409).json({
      error: 'This dashboard contains a live server connection and cannot be shared yet.',
    });
  }

  const shareToken = generateShareToken();
  const inserted = await pool.query(
    `INSERT INTO dashboard_shares (dashboard_id, share_token)
     VALUES ($1, $2)
     RETURNING id, dashboard_id, share_token, created_at, revoked_at`,
    [dashboardId, shareToken]
  );

  res.status(201).json(inserted.rows[0]);
});

sharesRouter.get('/dashboards/:id/shares', async (req, res) => {
  const result = await pool.query(
    `SELECT id, dashboard_id, share_token, created_at, revoked_at
     FROM dashboard_shares WHERE dashboard_id = $1 ORDER BY created_at DESC`,
    [req.params.id]
  );
  res.json(result.rows);
});

sharesRouter.delete('/dashboards/:id/shares/:shareId', async (req, res) => {
  const { id: dashboardId, shareId } = req.params;

  const updated = await pool.query(
    `UPDATE dashboard_shares SET revoked_at = now()
     WHERE id = $1 AND dashboard_id = $2 AND revoked_at IS NULL
     RETURNING id, dashboard_id, share_token, created_at, revoked_at`,
    [shareId, dashboardId]
  );

  if (updated.rows.length === 0) {
    return res.status(404).json({ error: 'Active share not found.' });
  }

  res.json(updated.rows[0]);
});

// Public endpoint — no auth. Anyone holding a valid, non-revoked
// share_token can view the resolved dashboard.
sharesRouter.get('/shared/:token', async (req, res) => {
  const { token } = req.params;

  const shareResult = await pool.query(
    `SELECT id, dashboard_id, revoked_at FROM dashboard_shares WHERE share_token = $1`,
    [token]
  );
  const share = shareResult.rows[0];
  if (!share) {
    return res.status(404).json({ error: 'This share link is invalid.' });
  }
  if (share.revoked_at) {
    return res.status(410).json({ error: 'This share link has been revoked.' });
  }

  const dashboardResult = await pool.query(
    `SELECT id, name, created_at FROM dashboards WHERE id = $1`,
    [share.dashboard_id]
  );
  const dashboard = dashboardResult.rows[0];
  if (!dashboard) {
    return res.status(404).json({ error: 'This share link is invalid.' });
  }

  const chartsResult = await pool.query(
    `SELECT id, dashboard_id, dataset_id, chart_type, config,
            position_x, position_y, width, height, created_at
     FROM charts WHERE dashboard_id = $1 ORDER BY id ASC`,
    [dashboard.id]
  );

  const charts = await Promise.all(
    chartsResult.rows.map(async (chart) => {
      try {
        return { ...chart, data: await getTransformedRows(chart.dataset_id) };
      } catch (err) {
        console.error(`Failed to resolve shared chart ${chart.id} (dataset ${chart.dataset_id}):`, err);
        return { ...chart, data: null, error: err.message || 'Failed to load chart data.' };
      }
    })
  );

  res.json({ ...dashboard, charts });
});
