// CommonJS runner for root-level integration datetime tests (outside ./ui)
// Uses UI's jest and ts-jest via --prefix ui to execute tests under tests/integration/date_time/**.
//
// Usage:
//   node scripts/integration/date_time/run_root_matrix.js
//
// Artifacts:
//   - logs/integration/date_time/root_matrix_<tz_safe>_<UTC>.log
//   - results/integration/date_time/results_summary_root.json
//   - results/integration/date_time/results_summary_root.md
//
// Notes:
//   - This runner targets new recurrence and date_time tests placed under tests/integration/date_time/**.
//   - It sets MATRIX_TZ per run to ensure deterministic timezone behavior.

const { spawn } = require('child_process');
const { mkdirSync, writeFileSync, existsSync } = require('fs');
const { join } = require('path');
const os = require('os');

const projectRoot = join(__dirname, '../../..');
const logsDir = join(projectRoot, 'logs', 'integration', 'date_time');
const resultsDir = join(projectRoot, 'results', 'integration', 'date_time');

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'Europe/Berlin',
  'Asia/Kolkata',
  'Australia/Sydney',
  'Pacific/Apia',
  'Pacific/Chatham',
  'Asia/Tehran',
  'America/Santiago'
];

const nowUtcIso = () =>
  new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
const safe = (s) => s.replace(/[^\w.-]+/g, '_');

function ensureDirs() {
  [logsDir, resultsDir].forEach((d) => {
    if (!existsSync(d)) mkdirSync(d, { recursive: true });
  });
}

function envCapture() {
  let intlInfo = { supportedTimeZoneCount: null, defaultTimeZone: null };
  try {
    const count =
      typeof Intl.supportedValuesOf === 'function'
        ? Intl.supportedValuesOf('timeZone').length
        : null;
    const defaultTz = new Intl.DateTimeFormat().resolvedOptions().timeZone;
    intlInfo = { supportedTimeZoneCount: count, defaultTimeZone: defaultTz };
  } catch {
    // ignore
  }
  return {
    nodeVersion: process.version,
    platform: process.platform,
    release: os.release(),
    arch: process.arch,
    icuVersion: process.versions.icu,
    tzdbProxy: intlInfo
  };
}

function runForTimezone(tz) {
  return new Promise((resolve) => {
    const timestamp = nowUtcIso();
    const logPath = join(logsDir, `root_matrix_${safe(tz)}_${timestamp}.log`);

    const args = [
      '--prefix',
      'ui',
      'exec',
      'jest',
      '--',
      '--config',
      'scripts/integration/date_time/jest.root.config.simplified.cjs',
      '--runInBand',
      '--ci',
      '--verbose=false',
      '--testPathPatterns=tests/integration/date_time'
    ];

    const child = spawn('npm', args, {
      cwd: projectRoot,
      env: {
        ...process.env,
        MATRIX_TZ: tz
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32'
    });

    let stdoutBuf = '';
    let stderrBuf = '';

    child.stdout.on('data', (d) => (stdoutBuf += d.toString()));
    child.stderr.on('data', (d) => (stderrBuf += d.toString()));

    const started = Date.now();
    child.on('close', (exitCode) => {
      const durationMs = Date.now() - started;

      const header = [
        `=== Root Date/Time Matrix Run ===`,
        `When (UTC): ${new Date().toISOString()}`,
        `Timezone: ${tz}`,
        `Command: npm ${args.join(' ')}`,
        `DurationMs: ${durationMs}`,
        `ExitCode: ${exitCode}`,
        `Env: ${JSON.stringify(envCapture())}`,
        `=================================`,
        ''
      ].join('\n');

      writeFileSync(logPath, header + stdoutBuf + '\n--- STDERR ---\n' + stderrBuf);

      resolve({
        timezone: tz,
        startedUtc: new Date(started).toISOString(),
        durationMs,
        exitCode,
        status: exitCode === 0 ? 'Pass' : 'Fail',
        logFile: logPath
      });
    });
  });
}

async function main() {
  ensureDirs();

  const allStart = Date.now();
  const matrixResults = [];
  for (const tz of TIMEZONES) {
    console.log(`Running ROOT Date/Time tests for TZ = ${tz} ...`);
    // eslint-disable-next-line no-await-in-loop
    const r = await runForTimezone(tz);
    matrixResults.push(r);
  }
  const allDuration = Date.now() - allStart;

  const summary = {
    executionId: `root_date_time_matrix_${nowUtcIso()}`,
    startedUtc: new Date(allStart).toISOString(),
    durationMs: allDuration,
    environment: envCapture(),
    timezones: TIMEZONES,
    results: matrixResults,
    rollup: {
      total: matrixResults.length,
      passed: matrixResults.filter((r) => r.status === 'Pass').length,
      failed: matrixResults.filter((r) => r.status !== 'Pass').length,
      averageDurationMs:
        matrixResults.length === 0
          ? 0
          : Math.round(
              matrixResults.reduce((a, b) => a + b.durationMs, 0) /
                matrixResults.length
            )
    }
  };

  const summaryJsonPath = join(resultsDir, 'results_summary_root.json');
  writeFileSync(summaryJsonPath, JSON.stringify(summary, null, 2), 'utf8');

  const mdLines = [];
  mdLines.push('# Root Date/Time Matrix Results Summary');
  mdLines.push('');
  mdLines.push(`- Execution ID: ${summary.executionId}`);
  mdLines.push(`- Started (UTC): ${summary.startedUtc}`);
  mdLines.push(`- Total Duration: ${summary.durationMs} ms`);
  mdLines.push(`- Node: ${summary.environment.nodeVersion}, ICU: ${summary.environment.icuVersion}`);
  mdLines.push(`- Timezones: ${TIMEZONES.join(', ')}`);
  mdLines.push('');
  mdLines.push('## Rollup');
  mdLines.push(`- Total: ${summary.rollup.total}`);
  mdLines.push(`- Passed: ${summary.rollup.passed}`);
  mdLines.push(`- Failed: ${summary.rollup.failed}`);
  mdLines.push(`- Avg Duration (ms): ${summary.rollup.averageDurationMs}`);
  mdLines.push('');
  mdLines.push('## Per-Timezone Results');
  mdLines.push('');
  mdLines.push('| Timezone | Status | Duration (ms) | Log |');
  mdLines.push('|----------|--------|---------------|-----|');
  for (const r of matrixResults) {
    const relLog = r.logFile.replace(projectRoot + '\\\\', '').replace(projectRoot + '/', '');
    mdLines.push(`| ${r.timezone} | ${r.status} | ${r.durationMs} | ${relLog} |`);
  }

  const summaryMdPath = join(resultsDir, 'results_summary_root.md');
  writeFileSync(summaryMdPath, mdLines.join('\n'), 'utf8');

  console.log('Root matrix run complete.');
  console.log(`Summary JSON: ${summaryJsonPath}`);
  console.log(`Summary MD:   ${summaryMdPath}`);
}

main().catch((err) => {
  console.error('Root matrix runner failed:', err);
  process.exit(1);
});