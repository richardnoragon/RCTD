# Test Repository Structure

This directory uses an enterprise-aligned layout to keep automated specs, domain suites, supporting utilities, and historical reports clearly separated.

```text
integration/
  config/          # Static configuration files and environment fixtures
  reports/         # Execution logs and governance documentation
  specs/           # Cross-cutting integration specifications
  suites/          # Domain-focused suites (date-time, sync, etc.)
  support/         # Shared setup and mocking utilities
unit/
  ...              # Unit-level artifacts (unchanged)
archive/
  ...              # Frozen historical artifacts
```

Each suite keeps its own data generators and legacy assets. Shared mocks live under `integration/support` so cross-suite imports remain consistent.
