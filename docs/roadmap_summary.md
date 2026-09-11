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

1. Build bundle-size governance in CI: [Issue #3](https://github.com/richardnoragon/RCTD/issues/3)
2. Implement route-level code splitting and manual chunks: [Issue #4](https://github.com/richardnoragon/RCTD/issues/4)
3. Add lazy-loading boundaries for major feature modules: [Issue #5](https://github.com/richardnoragon/RCTD/issues/5)
4. Profile and optimize backend SQLite hot queries: [Issue #6](https://github.com/richardnoragon/RCTD/issues/6)
5. Add structured timing observability for Tauri + UI fetches: [Issue #2](https://github.com/richardnoragon/RCTD/issues/2)

### Roadmap Group B (Sprint Performance 2, Weeks 3-4)

1. Measure and optimize cold-start path for Tauri + UI bootstrap: [Issue #7](https://github.com/richardnoragon/RCTD/issues/7)
2. Virtualize dense list/calendar views for large datasets: [Issue #8](https://github.com/richardnoragon/RCTD/issues/8)
3. Add SQLite FTS-backed search indexing path: [Issue #9](https://github.com/richardnoragon/RCTD/issues/9)
4. Add performance regression integration suite and reporting artifacts: [Issue #10](https://github.com/richardnoragon/RCTD/issues/10)

### Implementation Notes

- All created issues include suggested labels and milestone tags inside issue bodies for consistent triage.
- Group A is ordered to establish guardrails and immediate wins before deeper optimization work.
- Group B depends on Group A instrumentation and baseline measurements.
- Issue #3 implementation is now in place via `.github/workflows/bundle-budget-gate.yml` and the UI bundle checker script/config.
- Issue #4 implementation is now in place via route-level lazy loading in `ui/src/App.tsx` and manual chunking in `ui/vite.config.ts`.
- Issue #5 implementation is now in place via lazy boundary hardening and non-blocking shell rendering in `ui/src/App.tsx`.
- Milestone links:
- Sprint 1 milestone: [Milestone 1](https://github.com/richardnoragon/RCTD/milestone/1)
- Sprint 2 milestone: [Milestone 2](https://github.com/richardnoragon/RCTD/milestone/2)

### Next Theme Queue

- After the performance track above, the next roadmap theme selected is Task/Kanban UX improvements.
