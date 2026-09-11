// CommonJS runner for the performance regression suite.
// It executes the existing UI and backend perf-sensitive tests, captures
// logs for each scenario, and writes machine-readable plus markdown summaries
// under results/integration/performance.

const { spawn } = require('node:child_process');
const { existsSync, mkdirSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const os = require('node:os');

const projectRoot = join(__dirname, '../../..');
const logsDir = join(projectRoot, 'logs', 'integration', 'performance');
const resultsDir = join(projectRoot, 'results', 'integration', 'performance');

const nowUtcIso = () =>
  new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');

const safe = (value) => value.replace(/[^\w.-]+/g, '_');

const SCENARIOS = [
  {
    name: 'ui-search-component-performance',
    category: 'UI',
    budgetMs: 4000,
    command: 'npm',
    args: [
      '--prefix',
      'ui',
      'exec',
      'jest',
      '--',
      '--runInBand',
      '--ci',
      '--verbose=false',
      '--collectCoverage=false',
      '--runTestsByPath',
      'src/components/search/Search.perf.test.tsx'
    ],
    description: 'Search debounce and large-result handling'
  },
  {
    name: 'ui-task-list-performance',
    category: 'UI',
    budgetMs: 6000,
    command: 'npm',
    args: [
      '--prefix',
      'ui',
      'exec',
      'jest',
      '--',
      '--runInBand',
      '--ci',
      '--verbose=false',
      '--collectCoverage=false',
      '--runTestsByPath',
      'src/components/tasks/TaskListView.test.tsx'
    ],
    description: 'Dense task list rendering and virtualization guardrails'
  },
  {
    name: 'backend-query-optimization-tests',
    category: 'Backend',
    budgetMs: 8000,
    command: 'cargo',
    args: ['test', 'query_optimization_tests', '--', '--nocapture'],
    description: 'Hot query plan validation and index usage'
  },
  {
    name: 'backend-search-regression-tests',
    category: 'Backend',
    budgetMs: 10000,
    command: 'cargo',
    args: ['test', 'search_tests', '--', '--nocapture'],
    description: 'FTS-backed search path and large dataset regression checks'
  },
  {
    name: 'backend-performance-tests',
    category: 'Backend',
    budgetMs: 8000,
    command: 'cargo',
    args: ['test', 'performance_tests', '--', '--nocapture'],
    description: 'Bulk database and search performance smoke tests'
  }
];

function ensureDirs() {
  [logsDir, resultsDir].forEach((dir) => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  });
}

function envCapture() {
  return {
    nodeVersion: process.version,
    platform: process.platform,
    release: os.release(),
    arch: process.arch,
    icuVersion: process.versions.icu
  };
}

function runScenario(scenario) {
  return new Promise((resolve) => {
    const timestamp = nowUtcIso();
    const logPath = join(logsDir, `${safe(scenario.name)}_${timestamp}.log`);
    const startedAt = Date.now();
    const commandDisplay = `${scenario.command} ${scenario.args.join(' ')}`;

    const child = spawn(scenario.command, scenario.args, {
      cwd: projectRoot,
      env: {
        ...process.env
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32'
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (error) => {
      const durationMs = Date.now() - startedAt;
      const log = [
        '=== Performance Regression Scenario ===',
        `Scenario: ${scenario.name}`,
        `Category: ${scenario.category}`,
        `Command: ${commandDisplay}`,
        `BudgetMs: ${scenario.budgetMs}`,
        `DurationMs: ${durationMs}`,
        `Error: ${error.message}`,
        `Env: ${JSON.stringify(envCapture())}`,
        '======================================',
        ''
      ].join('\n');

      writeFileSync(logPath, `${log}${stdout}\n--- STDERR ---\n${stderr}`, 'utf8');

      resolve({
        name: scenario.name,
        category: scenario.category,
        description: scenario.description,
        command: commandDisplay,
        budgetMs: scenario.budgetMs,
        durationMs,
        exitCode: null,
        status: 'FAIL',
        failureReason: error.message,
        logFile: logPath,
        budgetUtilizationPct: Math.round((durationMs / scenario.budgetMs) * 100)
      });
    });

    child.on('close', (exitCode) => {
      const durationMs = Date.now() - startedAt;
      const budgetExceeded = durationMs > scenario.budgetMs;
      const status = exitCode === 0 && !budgetExceeded ? 'PASS' : 'FAIL';

      const header = [
        '=== Performance Regression Scenario ===',
        `Scenario: ${scenario.name}`,
        `Category: ${scenario.category}`,
        `Command: ${commandDisplay}`,
        `BudgetMs: ${scenario.budgetMs}`,
        `DurationMs: ${durationMs}`,
        `ExitCode: ${exitCode}`,
        `BudgetExceeded: ${budgetExceeded}`,
        `Env: ${JSON.stringify(envCapture())}`,
        '======================================',
        ''
      ].join('\n');

      writeFileSync(logPath, `${header}${stdout}\n--- STDERR ---\n${stderr}`, 'utf8');

      resolve({
        name: scenario.name,
        category: scenario.category,
        description: scenario.description,
        command: commandDisplay,
        budgetMs: scenario.budgetMs,
        durationMs,
        exitCode,
        status,
        failureReason: budgetExceeded ? 'Budget exceeded' : null,
        logFile: logPath,
        budgetUtilizationPct: Math.round((durationMs / scenario.budgetMs) * 100)
      });
    });
  });
}

async function main() {
  ensureDirs();

  const startedAt = Date.now();
  const executionId = `performance_regression_${nowUtcIso()}`;
  const results = [];

  for (const scenario of SCENARIOS) {
    console.log(`Running ${scenario.name} ...`);
    // eslint-disable-next-line no-await-in-loop
    results.push(await runScenario(scenario));
  }

  const durationMs = Date.now() - startedAt;
  const rollup = {
    total: results.length,
    passed: results.filter((result) => result.status === 'PASS').length,
    failed: results.filter((result) => result.status === 'FAIL').length,
    averageDurationMs:
      results.length === 0
        ? 0
        : Math.round(results.reduce((sum, result) => sum + result.durationMs, 0) / results.length),
    budgetBreaches: results.filter((result) => result.durationMs > result.budgetMs).length
  };

  const summary = {
    executionId,
    startedUtc: new Date(startedAt).toISOString(),
    durationMs,
    environment: envCapture(),
    results,
    rollup
  };

  const summaryJsonPath = join(resultsDir, 'results_summary.json');
  writeFileSync(summaryJsonPath, JSON.stringify(summary, null, 2), 'utf8');

  const scenarioRows = results.map((result) => {
    const relativeLog = result.logFile
      .replace(projectRoot + '\\', '')
      .replace(projectRoot + '/', '');

    return `| ${result.name} | ${result.category} | ${result.status} | ${result.durationMs} | ${result.budgetMs} | ${result.budgetUtilizationPct}% | ${relativeLog} |`;
  });

  const summaryMdLines = [
    '# Performance Regression Suite Results',
    '',
    `- Execution ID: ${executionId}`,
    `- Started (UTC): ${summary.startedUtc}`,
    `- Total Duration: ${durationMs} ms`,
    `- Node: ${summary.environment.nodeVersion}, ICU: ${summary.environment.icuVersion}`,
    '',
    '## Rollup',
    `- Total Scenarios: ${rollup.total}`,
    `- Passed: ${rollup.passed}`,
    `- Failed: ${rollup.failed}`,
    `- Average Duration (ms): ${rollup.averageDurationMs}`,
    `- Budget Breaches: ${rollup.budgetBreaches}`,
    '',
    '## Scenario Results',
    '',
    '| Scenario | Category | Status | Duration (ms) | Budget (ms) | Budget Use | Log |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...scenarioRows
  ];

  const summaryMdPath = join(resultsDir, 'results_summary.md');
  writeFileSync(summaryMdPath, summaryMdLines.join('\n'), 'utf8');

  console.log('Performance regression suite complete.');
  console.log(`Summary JSON: ${summaryJsonPath}`);
  console.log(`Summary MD:   ${summaryMdPath}`);
}

main().catch((error) => {
  console.error('Performance regression suite failed:', error);
  process.exit(1);
});