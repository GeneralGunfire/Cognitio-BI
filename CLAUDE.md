# BI Platform

Browser-based BI platform — a hybrid of Power BI's data-shaping experience and
open-source BI tools (Metabase/Superset). AI-assisted dashboard building is a
later phase. Current phase: **public read-only dashboard sharing**, scoped
to import-mode dashboards only (see Sharing section below).

Do not add export or AI features until explicitly asked. Cross-chart
filtering/highlighting and drill-through to source records are deliberately
deferred future phases — see Sharing section for why and what they depend on.

## Architecture

Monorepo with npm workspaces:

- `/frontend` — Vite + React. Routing: Home, Import, Connect Live Server
  (DirectQuery), Transform, Dashboards list, Dashboard canvas, plus the
  public read-only `/shared/:token` view (no app nav shown on that route).
  Charting via `echarts` + `echarts-for-react` — do not add another charting
  library without asking.
- `/backend` — Node.js + Express. Postgres via `pg`, MySQL via `mysql2`
  (external DirectQuery sources only — the platform's own database is always
  Postgres). No ORM.
- Database: PostgreSQL. Schema in `backend/src/db/schema.sql`, applied via
  `npm run migrate --workspace=backend`.

### Data model

- `users (id, email, created_at)`
- `datasets (id, user_id, name, source_type, source_mode, created_at)` —
  `source_mode` is `'import'` (default) or `'direct_query'`, modeled on
  Power BI's Import vs. DirectQuery modes.
- `dataset_rows (id, dataset_id, row_index, data JSONB)` — imported rows are
  stored as JSONB rather than dynamic per-dataset tables. Chosen for this
  phase because uploaded files have arbitrary/varying columns and dynamic DDL
  (CREATE TABLE per dataset) is significantly more complex to get right
  (type inference, migrations, name collisions). Tradeoff: column-level
  querying later needs JSONB operators or a future indexing/typing layer.
  Revisit this decision before building heavy analytical querying.
  **Only used for `source_mode = 'import'` datasets** — `direct_query`
  datasets never have rows here or anywhere else in this database (see
  DirectQuery section below).

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

### DirectQuery (live server connections)

Modeled directly on Power BI's Import vs. DirectQuery distinction. A dataset
with `source_mode = 'direct_query'` never has its row data persisted in this
platform, anywhere, ever — every read runs the stored query live against the
external source at request time and returns the result straight to the
caller.

- `data_connections (id, dataset_id, connection_type, host, port,
  database_name, username, encrypted_password, query_definition,
  created_at)` — `connection_type` is `'postgres'` or `'mysql'` (ask before
  adding others). `query_definition` is either a bare table/view name or a
  full SQL query, run as-is (or wrapped as `SELECT * FROM <name>` when it's a
  bare identifier) against the external source.
- **Hard governance rule: no row data from a direct_query source is ever
  written to this database.** There is no caching, materialization, or
  staging table for DirectQuery results — not even temporarily. If a future
  feature wants to cache DirectQuery results, that requires an explicit,
  separate decision (with its own staleness/governance story), not a default.
- `encrypted_password` is ciphertext, never plaintext: AES-256-GCM via
  Node's `crypto` module (`backend/src/crypto/encryption.js`), keyed by the
  `CONNECTION_ENCRYPTION_KEY` env var (32 bytes / 64 hex chars, never
  committed). Stored format is `iv:authTag:ciphertext`, hex-encoded, all in
  the one column — GCM's auth tag means tampering with stored ciphertext is
  detected, not just confidentiality.
- Routes (`backend/src/routes/connections.js`):
  `POST /api/datasets/:id/connection` (create/store, marks the dataset
  `direct_query`), `POST /api/datasets/:id/connection/test` (connects, runs
  `SELECT 1`, returns success/failure only — never rows), and
  `GET /api/datasets/:id/live-data` (decrypts credentials, opens a
  short-lived connection, runs `query_definition`, returns rows, closes the
  connection — no connection is held open per dataset between requests).
  `POST /api/datasets/direct-query` creates the bare dataset row before a
  connection is attached.
- External connection failures (unreachable host, auth failure, bad query)
  are caught and returned as a normal JSON error response — they must never
  crash the backend process.
- `fetchLiveRows(connection)` and `getConnectionForDataset(datasetId)`
  (`backend/src/routes/connections.js`) are the single source of truth for
  running a connection's live query. `backend/src/transforms/resolve.js`
  imports and reuses them directly rather than duplicating connection/query
  logic — see Transform layer below for how this plugs into replay.

### Transform layer

Power Query-style, **non-destructive** transforms, shared identically by
import and direct_query datasets. The original rows (`dataset_rows` for
import, or the external source for direct_query) are never mutated or
overwritten by a transform. Instead:

- `transform_steps (id, dataset_id, step_order, operation_type, params
  JSONB, created_at)` stores an ordered list of transform steps per dataset.
  Applying steps (`replaySteps` in `backend/src/transforms/engine.js`) is a
  pure function over an array of row objects — it has no idea whether those
  rows came from `dataset_rows` or a live external query, which is what lets
  both source modes share it unchanged.
- `backend/src/transforms/resolve.js` is mode-aware about **where the base
  rows come from**, then hands off to the shared replay logic:
  - `source_mode = 'import'` → `getOriginalRows()` reads `dataset_rows`.
  - `source_mode = 'direct_query'` → `getBaseRows()` looks up the dataset's
    `data_connections` row and calls `fetchLiveRows()` (from
    `backend/src/routes/connections.js`, imported not duplicated) to run the
    connection's query live, then replays the same `transform_steps` on top
    of whatever rows came back.
  - Either way, `getTransformedRows(datasetId)` is the single entry point
    both the transform routes and dashboard routes call — callers never
    branch on source_mode themselves.
  - For direct_query datasets, this means a live round-trip to the external
    source **on every call** to `getTransformedRows` — no caching yet (see
    Dashboards and charts below for the resulting per-dashboard-load cost).
- `GET /api/datasets/:id/transformed-view` (used by the Transform page)
  works unchanged for both modes — same steps UI, same preview, just a
  different data source underneath. If the live source is unreachable, this
  endpoint returns a JSON error rather than crashing.
- Deleting a step renumbers subsequent steps' `step_order` to stay
  contiguous; reordering rewrites `step_order` for the given step id list.

Supported v1 operations (`operation_type` values in `transform_steps.params`,
implemented in `backend/src/transforms/engine.js`): `rename_column`,
`change_type` (text/number/date/boolean, with graceful null-on-failure
conversion), `remove_column`, `reorder_columns`, `filter_rows` (equals,
contains, greater_than, less_than, is_blank, is_not_blank), `remove_duplicates`,
`trim_text` (whitespace + case normalization), `split_column` (by delimiter),
`fill_down`. Ask before adding new operation types.

### Dashboards and charts

First visual output layer. **No export or AI features yet.** Public
read-only sharing exists but is scoped to import-mode dashboards only — see
Sharing section below.

- `dashboards (id, user_id, name, created_at)` — a named canvas owned by a
  user (attributed to the same bootstrap user as datasets, for now).
- `dashboard_pages (id, dashboard_id, name, page_order, created_at)` —
  Power BI-style report pages within a dashboard. Every dashboard is created
  with a default "Page 1" (in the same transaction); every chart belongs to
  exactly one page via `charts.page_id`, and deleting a page cascades to its
  charts. The server refuses to delete a dashboard's last page. Page CRUD:
  `POST/PATCH/DELETE /api/dashboards/:id/pages[/:pageId]` (POST auto-names
  "Page N" when no name is given). The canvas UI renders one page at a time
  via the bottom page tabs (click switch, "+" add, double-click rename, "×"
  delete); `GET /dashboards/:id/full` returns `pages` plus a flat `charts`
  array carrying `page_id` — the client filters per page. The shared
  (read-only) view still renders all charts regardless of page for now.
- `charts (id, dashboard_id, page_id, dataset_id, chart_type, config JSONB,
  position_x, position_y, width, height, created_at)` — `chart_type` is one
  of `bar`, `line`, `pie`, `table`. `config` holds axis/series mappings
  (`{ x, y, series }`) plus any chart-specific options. A chart always reads
  the dataset's **transformed** view via `getTransformedRows()` in
  `backend/src/transforms/resolve.js`, shared with the transform routes —
  this works identically for import and direct_query datasets; charts never
  read `dataset_rows` or fetch live data directly themselves.
- `GET /api/dashboards/:id/full` returns the dashboard plus every chart with
  its resolved (transformed) data already attached, so the canvas renders in
  one round-trip. **For direct_query charts this means a live round-trip to
  the external source per chart per dashboard load** — there is no caching
  of DirectQuery results yet, so a dashboard with several direct_query
  charts is only as fast as its slowest external source. Flagged as a known
  future performance consideration; do not add caching without asking (see
  Governance principles).
  - **Per-chart error isolation:** each chart's data is resolved in its own
    try/catch (`Promise.all` over chart-level promises that each swallow
    their own rejection). If one chart's dataset fails to resolve (e.g. an
    unreachable direct_query source), that chart's payload comes back as
    `{ ...chart, data: null, error: "<message>" }` while every other chart
    on the dashboard still loads normally — one bad connection never fails
    the whole `/full` response.
  - `GET /api/dashboards/:id/charts/:chartId/data` re-resolves a single
    chart's data on demand. It backs the dashboard canvas's per-chart
    "Retry" button so retrying one failed chart doesn't require reloading
    the whole dashboard.
- Charts are positioned freely in pixels (`position_x/y`, `width/height`),
  not locked to a rigid layout grid. The frontend canvas
  (`frontend/src/components/ChartCard.jsx`) snaps drag/resize to an **8px**
  background grid, and — while dragging — to the edges/centers of other
  charts on the same dashboard (PowerPoint-style smart guides), rendering
  pink alignment guide lines when a snap is active. Snapping is client-side
  only; the server stores whatever pixel values the client sends.
- Charts are computed/rendered on read; nothing about a dashboard is
  materialized or cached, for either source mode.
- If a chart's `data` comes back `null` with an `error` message (see above),
  `frontend/src/components/ChartCard.jsx` renders an inline error state
  ("Unable to reach data source." + a manual Retry button) inside that
  chart's own card instead of the normal `ChartRenderer` — the rest of the
  canvas and its other charts are unaffected.

### Chart configuration UI: Fields pane + field wells

Modeled on Power BI's Fields pane and Visualizations field wells. This is a
**UI/interaction layer only** — the chart `config` shape it writes to is
unchanged (`{ x, y, series }` for bar/line, `{ x, y }` for pie treated as
category/value, `{ columns: [...] }` for table); no new data model, no new
backend endpoint.

- `frontend/src/components/FieldsPanel.jsx` — given the currently selected
  dataset's transformed-view rows (fetched via the existing
  `GET /api/datasets/:id/transformed-view` endpoint, no schema changes),
  derives a column list with an **inferred display type**
  (text/number/date/boolean) from sample row values. Search input filters
  the list by column name. Type inference here is presentational only (icon
  labeling) — it does not affect `change_type` or any other transform step.
- `frontend/src/components/ChartWells.jsx` — renders the drop-target
  "wells" for the chart type currently being configured: bar/line get X
  axis, Y axis, and optional Series; pie gets Category and Value (mapped to
  the same `x`/`y` config keys); table gets a single multi-value Columns
  well. `wellStateFromConfig`/`wellStateToConfig` convert between well UI
  state and the existing chart `config` object — this is the only place
  that translation happens, so the config shape stays the single source of
  truth.
- Drag-and-drop uses plain HTML5 drag events (`draggable`,
  `onDragStart`/`onDragOver`/`onDrop` — no drag-and-drop library). Dragging
  a field from the Fields panel onto a compatible well assigns it; each
  filled well shows the assigned field as a removable chip. Native
  `<select>` dropdowns remain alongside every well as a fallback input
  method — drag-and-drop is additive, not a replacement.
- `frontend/src/components/ChartConfigPanel.jsx` drives both flows: **Add
  Chart** (no dataset locked in yet) and **Edit Chart** (opened via the ✎
  button or a double-click on an existing chart's header in
  `ChartCard.jsx`), reusing the same Fields pane + wells UI for both. The
  submit button stays disabled until all required wells for the selected
  chart type are filled, mirroring the prior dropdown-based validation.
- **Single-dataset only, by design.** Each chart still reads from exactly
  one dataset, exactly as before this stage. There are no dataset
  relationships, joins, or cross-dataset field pickers — the Fields panel
  only ever shows columns from the one dataset already selected for the
  chart being configured. Multi-dataset relationships/joins are a
  deliberately deferred future stage; do not build them without asking.

### Sharing (dashboards only, import-mode only)

Public, unauthenticated read-only link sharing for dashboards.

- `dashboard_shares (id, dashboard_id, share_token, created_at,
  revoked_at)` — `share_token` is 32 random bytes (`crypto.randomBytes(32)`,
  64 hex chars), unguessable and unique. Revoking a share sets `revoked_at`
  rather than deleting the row, so past shares stay auditable and the
  history of who-shared-what-when isn't lost.
- **Hard governance limitation: only fully import-mode dashboards can be
  shared.** `POST /api/dashboards/:id/shares`
  (`backend/src/routes/shares.js`) joins `charts → datasets` and rejects
  (409) with `"This dashboard contains a live server connection and cannot
  be shared yet."` if any chart's dataset has `source_mode = 'direct_query'`.
  This is intentional, not a missing feature: a public unauthenticated link
  is exactly the kind of surface the DirectQuery persistence/governance
  rules were written to guard against, and extending sharing to
  direct_query dashboards needs its own explicit design (e.g. would every
  page view re-run the live query under an anonymous viewer's request?)
  before it's safe to build.
- `GET /api/dashboards/:id/shares` lists a dashboard's shares (active and
  revoked); `DELETE /api/dashboards/:id/shares/:shareId` revokes one
  (sets `revoked_at`, 404s if already revoked or not found).
- `GET /api/shared/:token` is the only **public** endpoint in the backend —
  no bootstrap-user scoping, callable by anyone with the token. It looks up
  the share by token, 404s if it doesn't exist, 410s if revoked, then
  resolves the dashboard exactly like `GET /api/dashboards/:id/full` does
  (same per-chart try/catch error isolation) — it does not duplicate that
  resolution logic, just reuses `getTransformedRows()`.
- There is no per-viewer auth on share links — anyone who has the URL can
  view the dashboard's data for as long as the share stays unrevoked. Do not
  treat a share link as access-controlled.
- Frontend: `frontend/src/components/SharePanel.jsx` (Share button + link
  list + copy/revoke, embedded in `DashboardCanvasPage`) and
  `frontend/src/pages/SharedDashboardPage.jsx` (the public `/shared/:token`
  view — charts rendered with the same `ChartRenderer`, but no drag/resize,
  no Add Chart, no owner controls of any kind). `App.jsx` hides the main
  app nav on `/shared/*` so anonymous viewers aren't shown links into the
  authoring app.
- **Deferred to later phases, not part of this stage:** cross-chart
  filtering/highlighting (clicking one chart filtering others on the same
  dashboard) and drill-through to source records (clicking a data point to
  see the underlying rows). Both are valid Power BI-parity features, but
  they depend on selection-state plumbing and per-dataset row addressing
  that don't exist yet — sequenced for later, not forgotten.

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
- **DirectQuery row data is never persisted.** For `source_mode =
  'direct_query'` datasets, only connection metadata and the query
  definition live in this database (`data_connections`). Row data is always
  fetched live at request time — via transforms, via dashboards, via the
  connection preview, all of it — and is never written to `dataset_rows`, a
  cache table, or anywhere else — this is a hard governance rule, not a
  performance default, since it's the entire reason a customer would choose
  DirectQuery over Import for sensitive/live data. This now applies
  end-to-end through transform replay and chart resolution, not just the
  original live-preview endpoint. Connection passwords are encrypted at
  rest (AES-256-GCM, key from `CONNECTION_ENCRYPTION_KEY`). Adding caching
  for DirectQuery results is an explicit, separate decision requiring
  sign-off — never a default optimization.
- **DirectQuery dashboards are not shareable.** Public share links
  (`dashboard_shares`) are rejected at creation time for any dashboard
  containing a direct_query chart. This is deliberate, not a gap — a public
  unauthenticated link is precisely the surface DirectQuery's
  no-persistence rule is meant to protect. Do not relax this without an
  explicit design discussion.

## Adding dependencies

Ask before adding any library or service not already in use in this repo.
This includes new npm packages, charting libraries, ORMs, auth providers, or
external SaaS/cloud services.

## Running locally

```
npm install
# create backend/.env from backend/.env.example, pointing at a local Postgres
# and setting CONNECTION_ENCRYPTION_KEY (see comment in .env.example)
npm run migrate --workspace=backend
npm run dev:backend   # http://localhost:4000
npm run dev:frontend  # http://localhost:5173 (proxies /api to backend)
```
