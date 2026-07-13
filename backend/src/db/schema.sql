-- BI Platform base schema

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS datasets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  source_type TEXT NOT NULL, -- e.g. 'csv', 'xlsx'
  -- 'import': rows are parsed client-side and persisted in dataset_rows.
  -- 'direct_query': no row data is ever persisted; rows are fetched live
  -- from the external source at request-time via data_connections.
  source_mode TEXT NOT NULL DEFAULT 'import',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Flexible JSONB storage for imported rows. See backend/README.md
-- for the tradeoffs behind this choice vs. dynamic per-dataset tables.
CREATE TABLE IF NOT EXISTS dataset_rows (
  id BIGSERIAL PRIMARY KEY,
  dataset_id INTEGER NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  row_index INTEGER NOT NULL,
  data JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_dataset_rows_dataset_id ON dataset_rows(dataset_id);
CREATE INDEX IF NOT EXISTS idx_dataset_rows_data_gin ON dataset_rows USING GIN (data);

-- Ordered, non-destructive transform steps. Original dataset_rows are never
-- mutated; the "current" view of a dataset is computed by replaying these
-- steps over the original rows on every request (no materialization yet).
CREATE TABLE IF NOT EXISTS transform_steps (
  id SERIAL PRIMARY KEY,
  dataset_id INTEGER NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  operation_type TEXT NOT NULL,
  params JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transform_steps_dataset_id ON transform_steps(dataset_id);

CREATE TABLE IF NOT EXISTS dashboards (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dashboards_user_id ON dashboards(user_id);

-- Charts render the fully-transformed view of a dataset (original rows +
-- replayed transform_steps), never raw dataset_rows directly. Position/size
-- are free-form pixel coordinates on the dashboard canvas; the frontend
-- snaps them to an 8px grid and to other charts' edges/centers while
-- dragging or resizing, but the stored values are whatever the user lands on
-- (not constrained to a rigid grid server-side).
CREATE TABLE IF NOT EXISTS charts (
  id SERIAL PRIMARY KEY,
  dashboard_id INTEGER NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
  dataset_id INTEGER NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  chart_type TEXT NOT NULL, -- 'bar', 'line', 'pie', 'table'
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  position_x INTEGER NOT NULL DEFAULT 0,
  position_y INTEGER NOT NULL DEFAULT 0,
  width INTEGER NOT NULL DEFAULT 400,
  height INTEGER NOT NULL DEFAULT 300,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_charts_dashboard_id ON charts(dashboard_id);

-- Connection details for DirectQuery-mode datasets, modeled on Power BI's
-- DirectQuery. Only connection metadata and the query definition are stored
-- here — actual row data for direct_query datasets is NEVER persisted
-- anywhere in this database. It is fetched live from the external source at
-- request-time and streamed straight back to the caller. encrypted_password
-- is AES-256-GCM ciphertext (iv:authTag:ciphertext, hex-encoded), never
-- plaintext.
CREATE TABLE IF NOT EXISTS data_connections (
  id SERIAL PRIMARY KEY,
  dataset_id INTEGER NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  connection_type TEXT NOT NULL, -- 'postgres' or 'mysql'
  host TEXT NOT NULL,
  port INTEGER NOT NULL,
  database_name TEXT NOT NULL,
  username TEXT NOT NULL,
  encrypted_password TEXT NOT NULL,
  query_definition TEXT NOT NULL, -- SQL query or table/view name to pull from
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_data_connections_dataset_id ON data_connections(dataset_id);

-- Public share links for dashboards. Scoped to import-mode dashboards only:
-- a dashboard containing any direct_query chart is rejected at share-creation
-- time (governance limitation for this stage — see dashboards.js). No
-- per-viewer auth yet; anyone with share_token can view. Revoking sets
-- revoked_at rather than deleting the row, so past shares stay auditable.
CREATE TABLE IF NOT EXISTS dashboard_shares (
  id SERIAL PRIMARY KEY,
  dashboard_id INTEGER NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_dashboard_shares_dashboard_id ON dashboard_shares(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_shares_token ON dashboard_shares(share_token);

-- datasets predates source_mode; CREATE TABLE IF NOT EXISTS is a no-op on an
-- already-existing table, so the column must be added explicitly here.
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS source_mode TEXT NOT NULL DEFAULT 'import';

-- Report-style pages within a dashboard (Power BI page tabs). Every chart
-- belongs to exactly one page; deleting a page cascades to its charts.
CREATE TABLE IF NOT EXISTS dashboard_pages (
  id SERIAL PRIMARY KEY,
  dashboard_id INTEGER NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  page_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dashboard_pages_dashboard_id ON dashboard_pages(dashboard_id);

-- charts predates pages; add the column explicitly (see source_mode note).
ALTER TABLE charts ADD COLUMN IF NOT EXISTS page_id INTEGER REFERENCES dashboard_pages(id) ON DELETE CASCADE;

-- Idempotent backfill: every dashboard gets a "Page 1", and any chart
-- created before pages existed is assigned to its dashboard's first page.
INSERT INTO dashboard_pages (dashboard_id, name, page_order)
SELECT d.id, 'Page 1', 0
FROM dashboards d
WHERE NOT EXISTS (SELECT 1 FROM dashboard_pages p WHERE p.dashboard_id = d.id);

UPDATE charts c
SET page_id = (
  SELECT p.id FROM dashboard_pages p
  WHERE p.dashboard_id = c.dashboard_id
  ORDER BY p.page_order, p.id
  LIMIT 1
)
WHERE c.page_id IS NULL;
