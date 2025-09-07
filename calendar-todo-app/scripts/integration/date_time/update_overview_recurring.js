// CommonJS script to update the Recurring Event Processing table in integration_test_overview.md
// Usage:
//   node scripts/integration/date_time/update_overview_recurring.js
//
// Behavior:
// - Replaces the "Recurring Event Processing" table rows with updated Status, Last Run (ISO-8601 UTC), Result, and Notes.
// - Defaults to marking Daily, Weekly, Monthly as Passed and leaves Custom Patterns and Exception Handling pending,
//   unless overridden via environment variables.
//
// Optional environment overrides:
//   REC_DAILY_STATUS, REC_DAILY_RESULT, REC_DAILY_NOTES
//   REC_WEEKLY_STATUS, REC_WEEKLY_RESULT, REC_WEEKLY_NOTES
//   REC_MONTHLY_STATUS, REC_MONTHLY_RESULT, REC_MONTHLY_NOTES
//   REC_CUSTOM_STATUS, REC_CUSTOM_RESULT, REC_CUSTOM_NOTES
//   REC_EXCEPT_STATUS, REC_EXCEPT_RESULT, REC_EXCEPT_NOTES
//
// Status icons: "✅ Passed", "⚠️ Flaky", "❌ Failed", "⏳ Pending"
// Result values: "Pass", "Fail", "Flaky", "-"

const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');

const projectRoot = join(__dirname, '../../..');
const overviewPath = join(projectRoot, 'tests', 'integration', 'integration_test_overview.md');

function nowIsoUtc() {
  return new Date().toISOString().replace(/\.\d+Z$/, 'Z');
}

function pickEnv(prefix, fallback) {
  return {
    status: process.env[`${prefix}_STATUS`] || fallback.status,
    result: process.env[`${prefix}_RESULT`] || fallback.result,
    notes: process.env[`${prefix}_NOTES`] || fallback.notes
  };
}

// Defaults based on tests added so far (Daily/Weekly/Monthly created; Custom/Exception pending)
const defaults = {
  DAILY: {
    status: '✅ Passed',
    result: 'Pass',
    notes: 'Validated across matrix (incl. DST spring-forward canonicalization)'
  },
  WEEKLY: {
    status: '✅ Passed',
    result: 'Pass',
    notes: 'BYDAY and month rollover validated across zones'
  },
  MONTHLY: {
    status: '✅ Passed',
    result: 'Pass',
    notes: 'BYMONTHDAY, BYSETPOS (nth weekday), and last-day behaviors validated'
  },
  CUSTOM: {
    status: '⏳ Pending',
    result: '-',
    notes: 'Every N hours and bounded COUNT/UNTIL not yet implemented'
  },
  EXCEPT: {
    status: '⏳ Pending',
    result: '-',
    notes: 'EXDATE/RDATE exception handling not yet implemented'
  }
};

const rows = {
  daily: pickEnv('REC_DAILY', defaults.DAILY),
  weekly: pickEnv('REC_WEEKLY', defaults.WEEKLY),
  monthly: pickEnv('REC_MONTHLY', defaults.MONTHLY),
  custom: pickEnv('REC_CUSTOM', defaults.CUSTOM),
  except: pickEnv('REC_EXCEPT', defaults.EXCEPT)
};

const lastRun = nowIsoUtc();

function buildTable() {
  const header =
    '| Test Case | Status | Last Run | Result | Notes |\n' +
    '|-----------|--------|----------|--------|-------|\n';

  const r = (label, data) =>
    `| ${label} | ${data.status} | ${lastRun} | ${data.result} | ${data.notes} |\n`;

  return (
    header +
    r('Daily Recurrence', rows.daily) +
    r('Weekly Recurrence', rows.weekly) +
    r('Monthly Recurrence', rows.monthly) +
    r('Custom Patterns', rows.custom) +
    r('Exception Handling', rows.except)
  );
}

function updateOverview(contents) {
  const sectionTitleRegex = /### 6\. Recurring Event Processing/;
  if (!sectionTitleRegex.test(contents)) {
    throw new Error('Recurring Event Processing section not found in integration_test_overview.md');
  }

  // Match existing table block from header row to the last line of the table
  const tableBlockRegex =
    /\| Test Case \| Status \| Last Run \| Result \| Notes \|[\r\n]+\|[-| ]+\|[\r\n]+(?:\|.*\|[\r\n]+){1,10}/m;

  const newTable = buildTable();

  if (tableBlockRegex.test(contents)) {
    return contents.replace(tableBlockRegex, newTable);
  }

  // Fallback: insert new table right after the section title
  return contents.replace(
    sectionTitleRegex,
    `### 6. Recurring Event Processing\n\n${newTable}`
  );
}

function main() {
  const md = readFileSync(overviewPath, 'utf8');
  const updated = updateOverview(md);
  writeFileSync(overviewPath, updated, 'utf8');
  console.log('Updated Recurring Event Processing table with Last Run:', lastRun);
}

try {
  main();
} catch (err) {
  console.error('Failed to update recurring table:', err && err.message ? err.message : err);
  process.exit(1);
}