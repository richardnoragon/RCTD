# Development Environment Setup

## Prerequisites

1. Install Rust and Cargo.
2. Install Node.js and npm.
3. Verify installations:

```sh
rustc --version
cargo --version
node --version
npm --version
```

## Initial Setup

1. Move to the application root:

```sh
cd calendar-todo-app
```

1. Install frontend dependencies:

```sh
cd ui
npm install
cd ..
```

## Run In Development

### Standard Run

```sh
cd calendar-todo-app
cargo tauri dev
```

### Run With Observability Timing Logs

```sh
cd calendar-todo-app
RCTD_OBSERVABILITY_LEVEL=debug cargo tauri dev
```

`RCTD_OBSERVABILITY_LEVEL` supports `error`, `warn`, `info`, and `debug`.

## Testing

Frontend tests:

```sh
cd calendar-todo-app/ui
npm run test
```

Accessibility tests:

```sh
cd calendar-todo-app/ui
npm run test:a11y
```

Backend tests:

```sh
cd calendar-todo-app
cargo test
```

## Bundle Budget Gate (Issue #3)

CI workflow:

- `.github/workflows/bundle-budget-gate.yml` runs on pull requests and pushes to `master`.
- The job builds the UI, runs budget checks, and uploads report artifacts.

Local usage from `calendar-todo-app/ui`:

```sh
npm run bundle:report
```

Runs build plus report generation without CI failure mode.

```sh
npm run bundle:check
```

Runs build plus strict budget enforcement (`--ci`), matching CI behavior.

```sh
npm run bundle:baseline
```

Writes current bundle metrics into `bundle-budget.json` as the new baseline.

Recommended baseline update process:

1. Make and review the intended bundling change.
2. Run `npm run bundle:report` and inspect `dist/bundle-budget-report.md`.
3. If the increase is intentional and acceptable, run `npm run bundle:baseline`.
4. Commit the updated `bundle-budget.json` in the same change set.

## Route-Level Code Splitting (Issue #4)

The UI build now applies route-level lazy loading plus manual vendor chunking.

Quick verification from `calendar-todo-app/ui`:

```sh
npm run bundle:report
```

Expected outcomes:

1. Build output includes route/view chunks (`Calendar`, `Search`, `TaskListView`, `KanbanBoard`, `TaskCalendarView`).
2. Build output includes vendor chunks (`vendor-fullcalendar`, `vendor-react`, `vendor-dnd`, `vendor-tauri`).
3. Bundle budget report passes under the configured hard limits.

## Lazy Loading Boundaries (Issue #5)

Lazy boundary validation from `calendar-todo-app/ui`:

```sh
npm run build
```

Runtime checks in dev mode:

1. Start the app and confirm the main shell renders immediately.
2. Switch between Calendar, Tasks, and Search views and verify each view shows a localized loading state when needed.
3. Confirm Tasks loading state does not block the header or view selector controls.
4. Confirm lazy chunks appear in build output for Calendar, Search, Kanban, Task Calendar, and Task List modules.

## Observability Verification

1. Open a task list view or Kanban column in the app.
2. In the frontend console, verify `RCTD_UI_FETCH_START` and `RCTD_UI_FETCH_TIMING` events.
3. In the backend terminal, verify JSON logs containing:
   - `event: tauri_command_start`
   - `event: tauri_command_timing`
   - matching `trace_id` values for correlated calls.

Optional frontend runtime toggles in devtools:

```js
globalThis.__RCTD_UI_TIMING_ENABLED = true;
globalThis.__RCTD_TRACE_PROPAGATION_ENABLED = true;
```

## Backend SQLite Query Optimization (Issue #6)

The backend applies additional query-optimization indexes during DB initialization and via migration:

- `migrations/003_query_optimization_indexes.sql`
- `src/db/mod.rs` (`apply_performance_indexes`)

Verification workflow (requires Rust toolchain):

```sh
cd calendar-todo-app
cargo test query_optimization_tests -- --nocapture
```

This suite uses `EXPLAIN QUERY PLAN` to verify index usage on event-range and task-order/status hot-path queries.

## Reminder Scheduling Resilience (Issue #1)

Reminder delivery now persists a delivery log so a reminder claims each UTC trigger once, survives restart rehydration, and respects dismissed-state checks.

Relevant files:

- `src/services/reminder_service.rs`
- `src/tests/reminder_tests.rs`
- `migrations/001_initial_schema.sql`

Validation workflow:

```sh
cd calendar-todo-app
cargo test reminder_tests -- --nocapture
```

Expected results:

- Duplicate claim attempts return no second firing.
- Restart rehydration only claims reminders that have not already been delivered.
- Dismissed reminders remain suppressed.

## Performance Regression Suite (Issue #10)

The regression suite combines the UI and backend hot-path checks into one repeatable runner and writes trend-friendly artifacts under `results/integration/performance`.

Relevant files:

- `scripts/integration/performance/run_regression_suite.js`
- `tests/integration/reports/performance_regression_suite.md`

Local execution:

```sh
cd calendar-todo-app
npm run perf:regression
```

Generated outputs:

- `results/integration/performance/results_summary.json`
- `results/integration/performance/results_summary.md`
- `logs/integration/performance/*.log`

Pass criteria:

1. Every scenario exits cleanly.
2. Every scenario stays within its configured duration budget.
3. Any budget breach is treated as a regression and surfaced in the summary.

## SQLite FTS Search Path (Issue #9)

The backend now builds a `search_index` FTS5 table during database initialization and keeps it synchronized with events, tasks, and notes through triggers. Search commands use the FTS path when available and fall back to the legacy `LIKE` path on SQLite builds that do not expose FTS5.

Relevant files:

- `src/db/mod.rs`
- `src/services/search_service.rs`
- `src/tests/search_tests.rs`

Validation workflow:

```sh
cd calendar-todo-app
cargo test search_tests -- --nocapture
```

The key regression check asserts that `search_index` exists in the test database and that inserted content is returned by `search_all`.

## Startup Cold-Path Optimization (Issue #7)

The frontend now defers non-critical task bootstrap until the browser idle phase and logs startup timing milestones for shell readiness and task hydration. The app shell therefore renders before background task hydration begins, reducing perceived startup latency without blocking navigation.

Relevant files:

- `ui/src/App.tsx`
- `ui/src/services/startupMetrics.ts`
- `ui/scripts/check-startup-budget.mjs`
- `ui/startup-budget.json`

Local checks:

```sh
cd calendar-todo-app/ui
npm run startup:check
```

The startup budget script validates current startup thresholds against a benchmark snapshot and writes `dist/startup-budget-report.json`.

## UI Virtualization for Dense Views (Issue #8)

Dense task lists now render through a lightweight windowed virtualization layer to cap the actual DOM nodes created for large result sets. This reduces render pressure for long task lists without changing filter/sort behavior or task interactions.

Relevant files:

- `ui/src/components/tasks/TaskListView.tsx`
- `ui/src/components/tasks/Tasks.css`
- `ui/src/components/tasks/TaskListView.test.tsx`

Validation workflow:

```sh
cd calendar-todo-app/ui
npx jest src/components/tasks/TaskListView.test.tsx --runInBand --watch=false
```

Expected outcome: the dense-list regression test ensures only a bounded subset of tasks is rendered at once while search, status filtering, and sorting still work.

## Production Build

```sh
cd calendar-todo-app
cargo tauri build
```

Build artifacts are produced under `calendar-todo-app/src-tauri/target/release`.
