# Performance Regression Suite

**Scope:** Issue #10 - Performance regression integration suite and reporting artifacts

This suite provides repeatable checks for the application’s most important UI and backend hot paths:

- UI search debounce and large-result handling
- UI dense task-list rendering and virtualization guardrails
- Backend query-plan and index-usage checks
- Backend search regression coverage, including the FTS-backed search path
- Backend bulk-operation performance smoke tests

## Execution

Run the suite from `calendar-todo-app`:

```sh
npm run perf:regression
```

The runner executes the existing perf-sensitive UI and Rust tests, captures per-scenario logs, and writes the generated artifacts to:

- `results/integration/performance/results_summary.json`
- `results/integration/performance/results_summary.md`
- `logs/integration/performance/*.log`

## Pass Criteria

- Each scenario must complete with exit code `0`.
- Each scenario must finish within its configured budget.
- Any budget breach is treated as a regression and marked `FAIL` in the summary.

## Scenario Budget Targets

| Scenario | Budget (ms) |
| --- | --- |
| UI search component performance | 4000 |
| UI task list performance | 6000 |
| Backend query optimization tests | 8000 |
| Backend search regression tests | 10000 |
| Backend performance tests | 8000 |

## Notes

- The first CI run may spend extra time compiling Rust targets; the generated summary still records the measured duration for trend tracking.
- The report file serves as the canonical description of the suite, while the `results/integration/performance` directory contains the generated execution artifacts.
