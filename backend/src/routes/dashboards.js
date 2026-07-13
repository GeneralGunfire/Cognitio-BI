import { Router } from 'express';
import { pool } from '../db/pool.js';
import { getBootstrapUserId } from './datasets.js';
import { getTransformedRows } from '../transforms/resolve.js';

export const dashboardsRouter = Router();

const CHART_TYPES = ['bar', 'line', 'pie', 'table'];

async function getDashboardOr404(id, res) {
  const result = await pool.query(
    `SELECT id, user_id, name, created_at FROM dashboards WHERE id = $1`,
    [id]
  );
  if (result.rows.length === 0) {
    res.status(404).json({ error: 'Dashboard not found.' });
    return null;
  }
  return result.rows[0];
}

dashboardsRouter.get('/dashboards', async (req, res) => {
  const result = await pool.query(
    `SELECT id, user_id, name, created_at FROM dashboards ORDER BY created_at DESC`
  );
  res.json(result.rows);
});

dashboardsRouter.post('/dashboards', async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: '"name" is required.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userId = await getBootstrapUserId();
    const inserted = await client.query(
      `INSERT INTO dashboards (user_id, name) VALUES ($1, $2)
       RETURNING id, user_id, name, created_at`,
      [userId, name]
    );
    const dashboard = inserted.rows[0];
    // Every dashboard starts with one page, like a new Power BI report.
    await client.query(
      `INSERT INTO dashboard_pages (dashboard_id, name, page_order) VALUES ($1, 'Page 1', 0)`,
      [dashboard.id]
    );
    await client.query('COMMIT');
    res.status(201).json(dashboard);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to create dashboard:', err);
    res.status(500).json({ error: 'Failed to create dashboard.' });
  } finally {
    client.release();
  }
});

dashboardsRouter.get('/dashboards/:id', async (req, res) => {
  const dashboard = await getDashboardOr404(req.params.id, res);
  if (!dashboard) return;
  res.json(dashboard);
});

dashboardsRouter.patch('/dashboards/:id', async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: '"name" is required.' });
  }

  const updated = await pool.query(
    `UPDATE dashboards SET name = $1 WHERE id = $2
     RETURNING id, user_id, name, created_at`,
    [name, req.params.id]
  );
  if (updated.rows.length === 0) {
    return res.status(404).json({ error: 'Dashboard not found.' });
  }
  res.json(updated.rows[0]);
});

dashboardsRouter.delete('/dashboards/:id', async (req, res) => {
  const deleted = await pool.query(`DELETE FROM dashboards WHERE id = $1 RETURNING id`, [
    req.params.id,
  ]);
  if (deleted.rows.length === 0) {
    return res.status(404).json({ error: 'Dashboard not found.' });
  }
  res.status(204).send();
});

// Full dashboard payload: dashboard metadata + every chart, each chart
// carrying its resolved (transformed) dataset rows so the canvas can render
// without a further round-trip per chart.
dashboardsRouter.get('/dashboards/:id/full', async (req, res) => {
  const dashboard = await getDashboardOr404(req.params.id, res);
  if (!dashboard) return;

  const pagesResult = await pool.query(
    `SELECT id, dashboard_id, name, page_order, created_at
     FROM dashboard_pages WHERE dashboard_id = $1 ORDER BY page_order ASC, id ASC`,
    [dashboard.id]
  );

  const chartsResult = await pool.query(
    `SELECT id, dashboard_id, page_id, dataset_id, chart_type, config,
            position_x, position_y, width, height, created_at
     FROM charts WHERE dashboard_id = $1 ORDER BY id ASC`,
    [dashboard.id]
  );

  const charts = await Promise.all(
    chartsResult.rows.map(async (chart) => {
      try {
        return { ...chart, data: await getTransformedRows(chart.dataset_id) };
      } catch (err) {
        console.error(`Failed to resolve chart ${chart.id} (dataset ${chart.dataset_id}):`, err);
        return { ...chart, data: null, error: err.message || 'Failed to load chart data.' };
      }
    })
  );

  res.json({ ...dashboard, pages: pagesResult.rows, charts });
});

// --- Pages (Power BI-style report page tabs) ---

dashboardsRouter.post('/dashboards/:id/pages', async (req, res) => {
  const dashboard = await getDashboardOr404(req.params.id, res);
  if (!dashboard) return;

  const orderResult = await pool.query(
    `SELECT COALESCE(MAX(page_order), -1) + 1 AS next_order, COUNT(*) AS count
     FROM dashboard_pages WHERE dashboard_id = $1`,
    [dashboard.id]
  );
  const nextOrder = orderResult.rows[0].next_order;
  const name = req.body?.name || `Page ${Number(orderResult.rows[0].count) + 1}`;

  const inserted = await pool.query(
    `INSERT INTO dashboard_pages (dashboard_id, name, page_order)
     VALUES ($1, $2, $3)
     RETURNING id, dashboard_id, name, page_order, created_at`,
    [dashboard.id, name, nextOrder]
  );
  res.status(201).json(inserted.rows[0]);
});

dashboardsRouter.patch('/dashboards/:id/pages/:pageId', async (req, res) => {
  const { id: dashboardId, pageId } = req.params;
  const { name } = req.body;
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: '"name" is required.' });
  }

  const updated = await pool.query(
    `UPDATE dashboard_pages SET name = $1 WHERE id = $2 AND dashboard_id = $3
     RETURNING id, dashboard_id, name, page_order, created_at`,
    [name, pageId, dashboardId]
  );
  if (updated.rows.length === 0) {
    return res.status(404).json({ error: 'Page not found.' });
  }
  res.json(updated.rows[0]);
});

dashboardsRouter.delete('/dashboards/:id/pages/:pageId', async (req, res) => {
  const { id: dashboardId, pageId } = req.params;

  const countResult = await pool.query(
    `SELECT COUNT(*) AS count FROM dashboard_pages WHERE dashboard_id = $1`,
    [dashboardId]
  );
  if (Number(countResult.rows[0].count) <= 1) {
    return res.status(400).json({ error: 'A dashboard must keep at least one page.' });
  }

  // Charts on the page are removed with it (FK cascade).
  const deleted = await pool.query(
    `DELETE FROM dashboard_pages WHERE id = $1 AND dashboard_id = $2 RETURNING id`,
    [pageId, dashboardId]
  );
  if (deleted.rows.length === 0) {
    return res.status(404).json({ error: 'Page not found.' });
  }
  res.status(204).send();
});

// Re-resolves a single chart's data — used by the dashboard canvas retry
// button so a failed direct_query chart can be retried without reloading
// every other chart on the dashboard.
dashboardsRouter.get('/dashboards/:id/charts/:chartId/data', async (req, res) => {
  const { id: dashboardId, chartId } = req.params;

  const result = await pool.query(
    `SELECT id, dashboard_id, dataset_id FROM charts WHERE id = $1 AND dashboard_id = $2`,
    [chartId, dashboardId]
  );
  const chart = result.rows[0];
  if (!chart) {
    return res.status(404).json({ error: 'Chart not found.' });
  }

  try {
    const data = await getTransformedRows(chart.dataset_id);
    res.json({ data });
  } catch (err) {
    console.error(`Failed to resolve chart ${chart.id} (dataset ${chart.dataset_id}):`, err);
    res.status(502).json({ error: err.message || 'Failed to load chart data.' });
  }
});

dashboardsRouter.post('/dashboards/:id/charts', async (req, res) => {
  const dashboardId = req.params.id;
  const {
    dataset_id,
    chart_type,
    config,
    page_id,
    position_x = 0,
    position_y = 0,
    width = 400,
    height = 300,
  } = req.body;

  if (!dataset_id) {
    return res.status(400).json({ error: '"dataset_id" is required.' });
  }
  if (!chart_type || !CHART_TYPES.includes(chart_type)) {
    return res.status(400).json({ error: `"chart_type" must be one of: ${CHART_TYPES.join(', ')}` });
  }

  // Resolve the target page: validate the given one belongs to this
  // dashboard, or fall back to the dashboard's first page.
  let pageId = page_id;
  if (pageId) {
    const pageCheck = await pool.query(
      `SELECT id FROM dashboard_pages WHERE id = $1 AND dashboard_id = $2`,
      [pageId, dashboardId]
    );
    if (pageCheck.rows.length === 0) {
      return res.status(400).json({ error: '"page_id" does not belong to this dashboard.' });
    }
  } else {
    const firstPage = await pool.query(
      `SELECT id FROM dashboard_pages WHERE dashboard_id = $1 ORDER BY page_order, id LIMIT 1`,
      [dashboardId]
    );
    pageId = firstPage.rows[0]?.id ?? null;
  }

  const inserted = await pool.query(
    `INSERT INTO charts
       (dashboard_id, page_id, dataset_id, chart_type, config, position_x, position_y, width, height)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, dashboard_id, page_id, dataset_id, chart_type, config,
               position_x, position_y, width, height, created_at`,
    [dashboardId, pageId, dataset_id, chart_type, JSON.stringify(config || {}), position_x, position_y, width, height]
  );

  res.status(201).json(inserted.rows[0]);
});

dashboardsRouter.patch('/dashboards/:id/charts/:chartId', async (req, res) => {
  const { id: dashboardId, chartId } = req.params;
  const { chart_type, config, position_x, position_y, width, height } = req.body;

  if (chart_type && !CHART_TYPES.includes(chart_type)) {
    return res.status(400).json({ error: `"chart_type" must be one of: ${CHART_TYPES.join(', ')}` });
  }

  const existing = await pool.query(
    `SELECT id, dashboard_id, dataset_id, chart_type, config,
            position_x, position_y, width, height, created_at
     FROM charts WHERE id = $1 AND dashboard_id = $2`,
    [chartId, dashboardId]
  );
  if (existing.rows.length === 0) {
    return res.status(404).json({ error: 'Chart not found.' });
  }
  const current = existing.rows[0];

  const next = {
    chart_type: chart_type ?? current.chart_type,
    config: config !== undefined ? config : current.config,
    position_x: position_x ?? current.position_x,
    position_y: position_y ?? current.position_y,
    width: width ?? current.width,
    height: height ?? current.height,
  };

  const updated = await pool.query(
    `UPDATE charts SET chart_type = $1, config = $2, position_x = $3,
                        position_y = $4, width = $5, height = $6
     WHERE id = $7
     RETURNING id, dashboard_id, dataset_id, chart_type, config,
               position_x, position_y, width, height, created_at`,
    [next.chart_type, JSON.stringify(next.config), next.position_x, next.position_y, next.width, next.height, chartId]
  );

  res.json(updated.rows[0]);
});

dashboardsRouter.delete('/dashboards/:id/charts/:chartId', async (req, res) => {
  const { id: dashboardId, chartId } = req.params;
  const deleted = await pool.query(
    `DELETE FROM charts WHERE id = $1 AND dashboard_id = $2 RETURNING id`,
    [chartId, dashboardId]
  );
  if (deleted.rows.length === 0) {
    return res.status(404).json({ error: 'Chart not found.' });
  }
  res.status(204).send();
});
