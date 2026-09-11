import fs from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();
const args = new Set(process.argv.slice(2));

const configPath = path.join(cwd, 'bundle-budget.json');
const distPath = path.join(cwd, 'dist');
const assetsPath = path.join(distPath, 'assets');
const reportJsonPath = path.join(distPath, 'bundle-budget-report.json');
const reportMdPath = path.join(distPath, 'bundle-budget-report.md');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function formatBytes(bytes) {
  const kb = bytes / 1024;
  return `${bytes} B (${kb.toFixed(2)} KiB)`;
}

function collectAssetFiles(dir) {
  if (!fs.existsSync(dir)) {
    throw new Error(`Missing assets directory: ${dir}`);
  }

  return fs.readdirSync(dir)
    .map((name) => {
      const filePath = path.join(dir, name);
      const stat = fs.statSync(filePath);
      return {
        name,
        absolutePath: filePath,
        size: stat.size,
      };
    })
    .filter((entry) => fs.statSync(entry.absolutePath).isFile());
}

function detectEntryAssetBytes(indexHtmlPath, assetsByName) {
  if (!fs.existsSync(indexHtmlPath)) {
    return 0;
  }

  const html = fs.readFileSync(indexHtmlPath, 'utf8');
  const match = html.match(/assets\/([^"']+\.js)/);
  if (!match) {
    return 0;
  }

  const entryName = match[1];
  const entry = assetsByName.get(entryName);
  return entry ? entry.size : 0;
}

function buildMetrics(assets) {
  const jsAssets = assets.filter((asset) => asset.name.endsWith('.js'));
  const cssAssets = assets.filter((asset) => asset.name.endsWith('.css'));

  const totalJsBytes = jsAssets.reduce((total, asset) => total + asset.size, 0);
  const totalCssBytes = cssAssets.reduce((total, asset) => total + asset.size, 0);
  const totalAssetsBytes = assets.reduce((total, asset) => total + asset.size, 0);

  const assetsByName = new Map(assets.map((asset) => [asset.name, asset]));
  const entryAssetBytes = detectEntryAssetBytes(path.join(distPath, 'index.html'), assetsByName);

  return {
    entryAssetBytes,
    totalJsBytes,
    totalCssBytes,
    totalAssetsBytes,
  };
}

function evaluateBudgets(config, metrics) {
  const checks = [
    {
      name: 'entryAssetBytes',
      limit: config.maxEntryAssetBytes,
      actual: metrics.entryAssetBytes,
    },
    {
      name: 'totalJsBytes',
      limit: config.maxTotalJsBytes,
      actual: metrics.totalJsBytes,
    },
    {
      name: 'totalCssBytes',
      limit: config.maxTotalCssBytes,
      actual: metrics.totalCssBytes,
    },
    {
      name: 'totalAssetsBytes',
      limit: config.maxTotalAssetsBytes,
      actual: metrics.totalAssetsBytes,
    },
  ];

  return checks.map((check) => ({
    ...check,
    status: check.actual <= check.limit ? 'pass' : 'fail',
    overBy: Math.max(0, check.actual - check.limit),
  }));
}

function buildReport(config, metrics, checks) {
  const baseline = config.baseline;
  const hasBaseline =
    baseline !== null && baseline !== undefined && typeof baseline === 'object';

  let delta = null;
  const warnings = [];

  if (hasBaseline) {
    delta = {
      entryAssetBytes: metrics.entryAssetBytes - baseline.entryAssetBytes,
      totalJsBytes: metrics.totalJsBytes - baseline.totalJsBytes,
      totalCssBytes: metrics.totalCssBytes - baseline.totalCssBytes,
      totalAssetsBytes: metrics.totalAssetsBytes - baseline.totalAssetsBytes,
    };

    for (const [key, value] of Object.entries(delta)) {
      if (Math.abs(value) >= config.warnDeltaBytes) {
        warnings.push(`${key} changed by ${formatBytes(value)}`);
      }
    }
  } else {
    warnings.push('Baseline not initialized. Run npm run bundle:baseline after validating current bundle output.');
  }

  return {
    generatedAt: new Date().toISOString(),
    baselineTimestamp: hasBaseline ? baseline.timestamp : 'unset',
    metrics,
    delta,
    checks,
    warnings,
  };
}

function writeReports(report) {
  fs.mkdirSync(distPath, { recursive: true });
  fs.writeFileSync(reportJsonPath, JSON.stringify(report, null, 2));

  const lines = [
    '# Bundle Budget Report',
    '',
    `Generated: ${report.generatedAt}`,
    `Baseline timestamp: ${report.baselineTimestamp}`,
    '',
    '## Metrics',
    '',
    `- entryAssetBytes: ${formatBytes(report.metrics.entryAssetBytes)}`,
    `- totalJsBytes: ${formatBytes(report.metrics.totalJsBytes)}`,
    `- totalCssBytes: ${formatBytes(report.metrics.totalCssBytes)}`,
    `- totalAssetsBytes: ${formatBytes(report.metrics.totalAssetsBytes)}`,
    '',
    '## Delta vs Baseline',
    '',
  ];

  if (report.delta === null) {
    lines.push('- baseline not initialized');
  } else {
    lines.push(
      `- entryAssetBytes: ${formatBytes(report.delta.entryAssetBytes)}`,
      `- totalJsBytes: ${formatBytes(report.delta.totalJsBytes)}`,
      `- totalCssBytes: ${formatBytes(report.delta.totalCssBytes)}`,
      `- totalAssetsBytes: ${formatBytes(report.delta.totalAssetsBytes)}`
    );
  }

  const checkLines = report.checks.map((check) => {
    const icon = check.status === 'pass' ? 'PASS' : 'FAIL';
    const over = check.overBy > 0 ? `, over by ${formatBytes(check.overBy)}` : '';
    return `- ${icon} ${check.name}: actual ${formatBytes(check.actual)}, limit ${formatBytes(check.limit)}${over}`;
  });

  lines.push('', '## Budget Checks', '', ...checkLines, '', '## Warnings', '');

  if (report.warnings.length === 0) {
    lines.push('- none');
  } else {
    for (const warning of report.warnings) {
      lines.push(`- ${warning}`);
    }
  }

  fs.writeFileSync(reportMdPath, `${lines.join('\n')}\n`);
}

function updateBaseline(configPathValue, config, metrics) {
  const nextConfig = {
    ...config,
    baseline: {
      ...metrics,
      timestamp: new Date().toISOString(),
    },
  };

  fs.writeFileSync(configPathValue, `${JSON.stringify(nextConfig, null, 2)}\n`);
}

function main() {
  if (!fs.existsSync(configPath)) {
    throw new Error(`Missing budget config: ${configPath}`);
  }

  const config = readJson(configPath);
  const assets = collectAssetFiles(assetsPath);
  const metrics = buildMetrics(assets);

  if (args.has('--write-baseline')) {
    updateBaseline(configPath, config, metrics);
    console.log('Bundle baseline updated in bundle-budget.json');
    return;
  }

  const checks = evaluateBudgets(config, metrics);
  const report = buildReport(config, metrics, checks);
  writeReports(report);

  const failed = checks.filter((check) => check.status === 'fail');
  const summary = failed.length === 0 ? 'PASS' : 'FAIL';
  console.log(`Bundle budget check: ${summary}`);
  console.log(`Report JSON: ${reportJsonPath}`);
  console.log(`Report MD: ${reportMdPath}`);
  if (report.delta === null) {
    console.log('Baseline status: not initialized (run npm run bundle:baseline)');
  }

  if (failed.length > 0 && args.has('--ci')) {
    for (const check of failed) {
      console.error(
        `Budget exceeded for ${check.name}: actual ${check.actual} bytes, limit ${check.limit} bytes`
      );
    }
    process.exit(1);
  }
}

main();
