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

## Production Build

```sh
cd calendar-todo-app
cargo tauri build
```

Build artifacts are produced under `calendar-todo-app/src-tauri/target/release`.
