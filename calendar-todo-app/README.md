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
