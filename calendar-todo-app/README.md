# Calendar and Todo Application

A high-performance desktop calendar application built with Rust/Tauri combining event management, Markdown note-taking, and To-Do list management.

## Project Structure

- `/src` - Core Rust backend code
- `/src-tauri` - Tauri configuration and main
- `/ui` - Frontend UI code
- `/migrations` - Database migrations
- `/tests` - Integration tests

## Observability Timing Logs

Issue #2 introduces structured timing logs for key Tauri task commands and UI task fetch flows.

### Backend command timing (Tauri)

- Instrumented commands:
- `get_tasks`
- `get_tasks_in_column`
- Log events:
- `tauri_command_start` (DEBUG)
- `tauri_command_timing` (INFO)
- Payload fields include `command`, `trace_id`, `duration_ms`, and command metadata.

### Backend log level control

Set `RCTD_OBSERVABILITY_LEVEL` before launching the app:

- `error`
- `warn`
- `info`
- `debug`

Defaults by build context:

- Test builds: `warn`
- Debug builds: `debug`
- Release builds: `info`

Example:

```sh
RCTD_OBSERVABILITY_LEVEL=debug cargo tauri dev
```

### UI fetch timing and trace correlation

- `taskService.getTasks` and `taskService.getTasksInColumn` now use a timed invoke wrapper.
- UI emits console events:
- `RCTD_UI_FETCH_START`
- `RCTD_UI_FETCH_TIMING`
- Trace context is propagated to Tauri commands (as `traceContext`) outside Jest test runtime.

Optional runtime overrides via global flags:

- `globalThis.__RCTD_UI_TIMING_ENABLED = false` disables UI timing logs.
- `globalThis.__RCTD_TRACE_PROPAGATION_ENABLED = false` disables trace context propagation.

## Issue #1 Reminder Scheduling Resilience

Issue #1 hardens reminder delivery so it survives restarts, remains idempotent across duplicate scheduler ticks, and keeps dismissed reminders from re-firing.

### What changed

- Reminders are treated as UTC instants when they are evaluated for delivery.
- Reminder claims are persisted in `reminder_delivery_log` so a reminder only fires once per scheduled trigger time.
- Dismissed reminders are stored as dismissed and excluded from due-reminder claims.
- Startup rehydration uses the same claim path to recover pending reminders after a restart.

### Bundle Files

- `src/services/reminder_service.rs`
- `migrations/001_initial_schema.sql`
- `src/db/mod.rs`
- `src/tests/reminder_tests.rs`

### Validation

From `calendar-todo-app`:

```sh
cargo test reminder_tests -- --nocapture
```

The regression tests cover duplicate scheduler ticks, restart rehydration, and dismissed reminder handling.

## CI Bundle Budget Gate

Issue #3 introduces a GitHub Actions quality gate that enforces JavaScript and CSS bundle budgets on every pull request and push to `master`.

### Files

- `.github/workflows/bundle-budget-gate.yml`
- `ui/scripts/check-bundle-budget.mjs`
- `ui/bundle-budget.json`

### Local commands

From `calendar-todo-app/ui`:

```sh
npm run bundle:report
```

Builds the UI and writes reports to:

- `dist/bundle-budget-report.json`
- `dist/bundle-budget-report.md`

To initialize or refresh the baseline after intentional changes:

```sh
npm run bundle:baseline
```

To run the same enforcement logic used in CI:

```sh
npm run bundle:check
```

### Budget policy

- CI fails when any hard limit in `ui/bundle-budget.json` is exceeded.
- CI always uploads bundle report artifacts, including on failed runs.
- Baseline drift warnings are informational and do not fail CI by themselves.

## Route-Level Code Splitting

Issue #4 introduces route-level lazy loading and manual vendor chunking.

### Route-Level Changes

- App-level views are lazy-loaded with `Suspense` fallbacks.
- Calendar stylesheet loading was moved into the Calendar component chunk.
- Vite manual chunk rules split key vendor groups:
  - `vendor-fullcalendar`
  - `vendor-react`
  - `vendor-dnd`
  - `vendor-tauri`

### Route-Level Benefits

- The main entry JavaScript chunk is significantly smaller than before.
- Feature code and styles are loaded on demand when users navigate views.
- Chunking is now deterministic enough for CI budget enforcement and trend tracking.

### Verification

From `calendar-todo-app/ui`:

```sh
npm run bundle:report
```

Then review:

- Vite build output for split chunks.
- `dist/bundle-budget-report.md` for budget status.

## Lazy Loading Boundaries

Issue #5 extends the route-level split by hardening lazy boundary behavior and loading UX.

### Boundary behavior

- Calendar, Search, and Tasks routes are dynamically imported.
- Task sub-views (Kanban, Task Calendar, Task List) are also lazy-loaded.
- View-level `Suspense` fallbacks are used so each route can resolve independently.

### Non-blocking shell behavior

- The app shell now renders immediately instead of waiting on task fetch completion.
- Task loading indicators are scoped to Task route content only.
- Navigation remains interactive while deferred modules and task data load.

## Startup Cold-Path Optimization

Issue #7 reduces time to interactive UI by deferring non-critical task hydration until the browser idle phase and by exposing startup timing milestones for shell readiness and task bootstrap.

### Startup Changes

- App shell render is no longer blocked by the initial task fetch.
- Task bootstrap is scheduled via the idle callback path when available.
- Startup phases are reported through `RCTD_STARTUP_PHASE` timing logs.
- A startup budget check script validates the shell and overall startup targets: `npm run startup:check`.

### Startup Files

- `ui/src/App.tsx`
- `ui/src/services/startupMetrics.ts`
- `ui/scripts/check-startup-budget.mjs`
- `ui/startup-budget.json`

### Startup Benefits

- The UI becomes usable immediately when the shell renders.
- Non-critical task hydration runs after initial paint, reducing cold-start perception.
- Timing snapshots can be compared against the startup budget to catch regressions.

## UI Virtualization for Dense Views

Issue #8 reduces render pressure for very large task lists by virtualizing the visible window instead of mounting every item in the DOM.

### Virtualization Changes

- The task list renders only the rows visible inside the current scroll viewport plus a small overscan buffer.
- Filters, sorting, scroll state, and task actions remain unchanged.
- A dense-list regression test verifies that large datasets stay within a bounded render window.

### Virtualization Files

- `ui/src/components/tasks/TaskListView.tsx`
- `ui/src/components/tasks/Tasks.css`
- `ui/src/components/tasks/TaskListView.test.tsx`

### Virtualization Benefits

- Large task lists no longer create hundreds of mounted cards at once.
- Scroll performance improves while memory and DOM churn remain bounded.

## Backend SQLite Query Optimization

Issue #6 improves backend query performance by making hot-path SQL index-friendly and deterministic.

### Query improvements

- Event range query now uses overlap predicate with ordered output:
  - `WHERE start_time <= ?2 AND end_time >= ?1 ORDER BY start_time ASC`
- Task queries now include stable ordering for board/range/status fetches:
  - `ORDER BY kanban_column_id ASC, kanban_order ASC, id ASC`
  - `ORDER BY due_date ASC, kanban_order ASC, id ASC`
  - `ORDER BY kanban_order ASC, id ASC`
- Task status updates now use static parameterized SQL with `CASE` for `completed_at` instead of dynamic SQL string construction.
- Search endpoints (`search_all`, `search_events`, `search_tasks`) were simplified to static prepared statements and optional-filter predicates.

### Index additions

- New migration: `migrations/003_query_optimization_indexes.sql`
- Runtime bootstrap also applies these indexes for compatibility on existing local databases.
- Added indexes:
  - `idx_events_time_window (start_time, end_time)`
  - `idx_events_category_start (category_id, start_time)`
  - `idx_tasks_status_order (status, kanban_order, id)`
  - `idx_tasks_column_order (kanban_column_id, kanban_order, id)`
  - `idx_tasks_due_order (due_date, kanban_order, id)`

  ## Issue #9 SQLite FTS Search Path

  Issue #9 adds an FTS5-backed `search_index` table that is rebuilt during database initialization and kept in sync with event, task, and note changes through triggers.

  ### Behavior

  - Search commands use the FTS path when `search_index` is available.
  - Search commands fall back to the original `LIKE` queries on SQLite builds without FTS5 support.
  - The regression test suite verifies both index creation and a representative search hit.

  ### Relevant files

  - `src/db/mod.rs`
  - `src/services/search_service.rs`
  - `src/tests/search_tests.rs`

  ### Search Validation

  From `calendar-todo-app`:

  ```sh
  cargo test search_tests -- --nocapture
  ```

  ## Issue #10 Performance Regression Suite

  Issue #10 adds a single runner that exercises the UI and backend performance hot paths and writes reproducible artifacts for trend tracking.

  ### What it checks

  - Search component debounce and large-result handling
  - Dense task-list rendering and virtualization guardrails
  - Backend query plans and search regressions
  - Backend bulk-operation performance smoke tests

  ### Run it locally

  ```sh
  npm run perf:regression
  ```

  ### Output artifacts

  - `results/integration/performance/results_summary.json`
  - `results/integration/performance/results_summary.md`
  - `logs/integration/performance/*.log`
  - `idx_tasks_category_due (category_id, due_date)`
  - `idx_notes_created_at (created_at)`

### Performance validation tests

- Added `src/tests/query_optimization_tests.rs` with `EXPLAIN QUERY PLAN` assertions for:
  - Event range queries
  - Task status queries
  - Task board-order queries
- Test module is wired through `src/tests/mod.rs`.
