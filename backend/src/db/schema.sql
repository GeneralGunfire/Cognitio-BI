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
