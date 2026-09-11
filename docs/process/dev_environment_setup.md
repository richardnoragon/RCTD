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

2. Install frontend dependencies:

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
