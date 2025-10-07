# UI Test Structure

The front-end test harness follows the same enterprise alignment used for the project-wide QA assets:

```text
integration/
  suites/
    date-time/        # Domain-focused integration suites (timezone, DST, formatting)
  support/            # Shared setup utilities and global mocks
```

- `integration/suites/date-time` contains the executable Jest suites plus data factories and test orchestrators.
- `integration/support` centralises the tauri invoke mocks that back the UI integration tests.
- Each suite exports helpers (for example `getDateTimeTestGlobal`) so new suites can share typed globals without duplicating boilerplate.

Run the suites with `npx jest --config jest.datetime.config.js` from `ui/`. The custom config targets this directory layout and uses `tsconfig.datetime.json` for strict type-safety during execution.
