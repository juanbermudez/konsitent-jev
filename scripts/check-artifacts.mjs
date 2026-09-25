import { deepStrictEqual, equal, ok } from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { hash, inventory, root, snapshot } from './evidence.mjs';

try {
  const manifest = JSON.parse(readFileSync(resolve(root, 'artifacts/current.json'), 'utf8'));
  equal(manifest.schemaVersion, 1, 'Invalid manifest schema');
  ok(typeof manifest.runId === 'string' && /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(manifest.runId), 'Invalid run ID');
  equal(manifest.status, 'passed', 'Latest run did not pass');
  equal(manifest.node, process.version, 'Node version changed');
  deepStrictEqual(manifest.features, inventory(), 'Feature inventory changed');
  deepStrictEqual(manifest.sourceHashes, snapshot(), 'Evidence is stale: inputs changed');
  const dir = resolve(root, 'artifacts/runs', manifest.runId);
  deepStrictEqual(JSON.parse(readFileSync(resolve(dir, 'manifest.json'), 'utf8')), manifest, 'Run manifest mismatch');
  deepStrictEqual(Object.keys(manifest.reports).sort(), manifest.features, 'Incomplete report inventory');
  for (const feature of manifest.features) {
    const bytes = readFileSync(resolve(dir, `${feature}.json`));
    equal(hash(bytes), manifest.reports[feature], 'Report changed after execution');
    const report = JSON.parse(bytes);
    equal(report.schemaVersion, 1);
    equal(report.runId, manifest.runId, 'Report belongs to another run');
    equal(report.feature, feature);
    equal(report.passed, true);
    ok(Array.isArray(report.scenarios) && report.scenarios.length > 0, 'No executed scenarios');
    const names = new Set();
    for (const scenario of report.scenarios) {
      ok(typeof scenario.name === 'string' && scenario.name.trim() && !names.has(scenario.name), 'Invalid/duplicate scenario name');
      names.add(scenario.name);
      equal(scenario.passed, true);
      equal(scenario.signal, null);
      ok(Number.isInteger(scenario.actualExitCode));
      equal(scenario.actualExitCode, scenario.expectedExitCode);
      deepStrictEqual(JSON.parse(scenario.stdout), scenario.expected);
    }
  }
  console.log(`PASS current evidence: ${manifest.features.length} feature(s), run ${manifest.runId}`);
} catch (error) {
  console.error(`FAIL evidence: ${error.message}`);
  process.exitCode = 1;
}
