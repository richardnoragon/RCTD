# Roadmap Summary

## Current Project Status

- `cargo tauri build` now completes end‑to‑end, producing MSI and NSIS bundles without Vite export errors or missing assets.
- Front-end build pipeline (`npm run build`) runs cleanly after tightening tsconfig coverage and aligning component exports/imports.
- UI integration suites execute from the new enterprise layout (`ui/tests/integration/suites/date-time`) with strict TS checks and green runs via `npx jest --config jest.datetime.config.js`.
- Shared test typings and mocks eliminate prior TS2304 `global` references across date/time specs.

## Implementation Overview

- Refactored `App.tsx` to use default component imports, simplified view rendering, and removed nested ternaries flagged by linting.
- Created `tsconfig.datetime.json` plus updated `jest.datetime.config.js` to consume the dedicated config through modern `transform` options.
- Reorganised UI tests into `integration/suites` and `integration/support`, exporting typed globals (`getIntegrationTestGlobal`) while fixing the mock invoke handler to preserve falsy responses.
- Added `ui/tests/README.md` documenting the enterprise-aligned layout and execution workflow for front-end suites.
- Ensured Tauri build pipeline re-invokes UI build pre-step and verified resulting Windows installers.

## Strategic Development Priorities

1. **Bundle Optimisation** – Address the ~574 kB Vite warning with route-based code splitting or manual chunk definitions.
2. **Suite Expansion** – Add additional integration suites (e.g., notifications, recurring events) under `ui/tests/integration/suites` and wire them into CI.
3. **Runtime Observability** – Introduce structured logging/telemetry within Tauri commands to surface errors captured by the UI mocks.
4. **Documentation Depth** – Extend `docs/product` and `docs/process` with user-facing release notes, CI execution guides, and links to generated build artifacts.
5. **State Management Hardening** – Layer optimistic UI and error states around Kanban and Task Calendar interactions to match production expectations.
