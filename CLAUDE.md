# BI Platform

Browser-based BI platform — a hybrid of Power BI's data-shaping experience and
open-source BI tools (Metabase/Superset). AI-assisted dashboard building is a
later phase. Current phase: **foundation only — data import and storage.**

Do not add dashboards, charts, sharing, or AI features until explicitly asked.

## Architecture

Monorepo with npm workspaces:

- `/frontend` — Vite + React. Minimal routing (Home, Import, Transform). No
  charting library chosen yet — do not add one without asking.
- `/backend` — Node.js + Express. Postgres via `pg`. No ORM.
- Database: PostgreSQL. Schema in `backend/src/db/schema.sql`, applied via
  `npm run migrate --workspace=backend`.

### Data model

- `users (id, email, created_at)`
- `datasets (id, user_id, name, source_type, created_at)`
- `dataset_rows (id, dataset_id, row_index, data JSONB)` — imported rows are
  stored as JSONB rather than dynamic per-dataset tables. Chosen for this
  phase because uploaded files have arbitrary/varying columns and dynamic DDL
  (CREATE TABLE per dataset) is significantly more complex to get right
  (type inference, migrations, name collisions). Tradeoff: column-level
  querying later needs JSONB operators or a future indexing/typing layer.
  Revisit this decision before building heavy analytical querying.

### Import flow

Files are parsed entirely client-side (`xlsx`/SheetJS in the browser handles
both CSV and Excel) so the raw file body never reaches the backend. The
frontend Import page: (1) user selects a file, (2) browser parses it and
shows a preview of the first 20 rows, (3) user names the dataset and clicks
confirm, (4) only then does the frontend POST the already-parsed JSON rows
to `POST /api/datasets/confirm-import`, which creates a `datasets` row and
bulk-inserts into `dataset_rows`.

There is currently no auth; imports attribute to a single bootstrap user
created on first use. Replace this before any multi-user use.

### Transform layer

Power Query-style, **non-destructive** transforms on top of imported data.
The original rows in `dataset_rows` are never mutated or overwritten by a
transform. Instead:

- `transform_steps (id, dataset_id, step_order, operation_type, params
  JSONB, created_at)` stores an ordered list of transform steps per dataset.
- A "current" view of a dataset is produced by **replaying** all of its
  `transform_steps`, in `step_order`, on top of the original `dataset_rows`.
  This replay happens on every request (`backend/src/transforms/engine.js`,
  used by `GET /api/datasets/:id/transformed-view`) — nothing is
  materialized or cached yet. Revisit if replay cost becomes a problem on
  large datasets.
- Deleting a step renumbers subsequent steps' `step_order` to stay
  contiguous; reordering rewrites `step_order` for the given step id list.

Supported v1 operations (`operation_type` values in `transform_steps.params`,
implemented in `backend/src/transforms/engine.js`): `rename_column`,
`change_type` (text/number/date/boolean, with graceful null-on-failure
conversion), `remove_column`, `reorder_columns`, `filter_rows` (equals,
contains, greater_than, less_than, is_blank, is_not_blank), `remove_duplicates`,
`trim_text` (whitespace + case normalization), `split_column` (by delimiter),
`fill_down`. Ask before adding new operation types.

## Governance principles

- **No raw server secrets flow through the platform.** DB credentials and
  other secrets live only in backend environment variables (`.env`, gitignored,
  see `backend/.env.example`). Never hardcode credentials in source. Never
  pass secrets to the frontend or embed them in client-visible responses.
- **Least-privilege data access.** Backend routes should only query the data
  they need for the request at hand. As auth is introduced, scope dataset
  access to the owning user — don't build "fetch everything" endpoints.
- **Client-side parse before backend storage.** Uploaded files are parsed in
  the browser, not on the server — the backend never receives or touches raw
  file bytes, only already-parsed JSON rows the user has previewed and
  confirmed. Keep new import paths consistent with this: parse/validate
  client-side, confirm, then send structured data to the backend.
- **Local-first / repo-based workflow.** This project runs locally against a
  local/self-hosted Postgres instance. Prefer plain SQL migrations checked
  into the repo (`backend/src/db/schema.sql`) over hidden cloud state or
  managed migration services, unless explicitly requested.

## Adding dependencies

Ask before adding any library or service not already in use in this repo.
This includes new npm packages, charting libraries, ORMs, auth providers, or
external SaaS/cloud services.

## Running locally

```
npm install
# create backend/.env from backend/.env.example, pointing at a local Postgres
npm run migrate --workspace=backend
npm run dev:backend   # http://localhost:4000
npm run dev:frontend  # http://localhost:5173 (proxies /api to backend)
```
