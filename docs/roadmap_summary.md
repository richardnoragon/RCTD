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

### Roadmap Group A (Sprint Performance 1, Weeks 1-2)

1. Build bundle-size governance in CI: https://github.com/richardnoragon/RCTD/issues/3
2. Implement route-level code splitting and manual chunks: https://github.com/richardnoragon/RCTD/issues/4
3. Add lazy-loading boundaries for major feature modules: https://github.com/richardnoragon/RCTD/issues/5
4. Profile and optimize backend SQLite hot queries: https://github.com/richardnoragon/RCTD/issues/6
5. Add structured timing observability for Tauri + UI fetches: https://github.com/richardnoragon/RCTD/issues/2

### Roadmap Group B (Sprint Performance 2, Weeks 3-4)

1. Measure and optimize cold-start path for Tauri + UI bootstrap: https://github.com/richardnoragon/RCTD/issues/7
2. Virtualize dense list/calendar views for large datasets: https://github.com/richardnoragon/RCTD/issues/8
3. Add SQLite FTS-backed search indexing path: https://github.com/richardnoragon/RCTD/issues/9
4. Add performance regression integration suite and reporting artifacts: https://github.com/richardnoragon/RCTD/issues/10

### Implementation Notes

- All created issues include suggested labels and milestone tags inside issue bodies for consistent triage.
- Group A is ordered to establish guardrails and immediate wins before deeper optimization work.
- Group B depends on Group A instrumentation and baseline measurements.
- Milestone links:
- Sprint 1 milestone: https://github.com/richardnoragon/RCTD/milestone/1
- Sprint 2 milestone: https://github.com/richardnoragon/RCTD/milestone/2

### Next Theme Queue

- After the performance track above, the next roadmap theme selected is Task/Kanban UX improvements.
