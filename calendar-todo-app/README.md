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
