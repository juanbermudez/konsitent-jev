import { deepStrictEqual } from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { hash, inventory, root, snapshot, writeJson } from './evidence.mjs';

const runId = randomUUID();
const directory = resolve(root, 'artifacts/runs', runId);
mkdirSync(directory, { recursive: true });
const currentPath = resolve(root, 'artifacts/current.json');
const manifest = { schemaVersion: 1, runId, status: 'running', node: process.version,
  startedAt: new Date().toISOString(), features: [], sourceHashes: {}, reports: {} };
// Supersede old evidence before preflight, so errors cannot preserve a green run.
writeJson(currentPath, manifest);
let failed = false;
try {
  manifest.features = inventory();
  manifest.sourceHashes = snapshot();
  for (const feature of manifest.features) {
    const child = spawnSync(process.execPath, ['--experimental-strip-types', 'testing/execute-feature.mjs', feature], {
      cwd: root, encoding: 'utf8', timeout: 45000, maxBuffer: 4 * 1024 * 1024,
    });
    let report;
    try {
      if (child.error) throw child.error;
      if (child.status !== 0) throw new Error(`Scenario worker failed (${child.status}): ${child.stderr}`);
      report = JSON.parse(child.stdout);
      if (report.feature !== feature || !Array.isArray(report.scenarios) || !report.scenarios.length
        || typeof report.passed !== 'boolean') throw new Error('Worker returned an invalid report');
    } catch (error) {
      report = { feature, passed: false, scenarios: [], failure: error.message, stderr: child.stderr };
    }
    report = { ...report, schemaVersion: 1, runId, completedAt: new Date().toISOString() };
    const path = resolve(directory, `${feature}.json`);
    writeJson(path, report);
    manifest.reports[feature] = hash(readFileSync(path));
    if (!report.passed) failed = true;
    console.log(`${report.passed ? 'PASS' : 'FAIL'} ${feature}: ${report.scenarios.length} executed scenarios`);
  }
  deepStrictEqual(snapshot(), manifest.sourceHashes, 'Inputs changed during execution');
} catch (error) {
  failed = true;
  manifest.failure = error.message;
  console.error(`FAIL ${error.message}`);
}
manifest.status = failed ? 'failed' : 'passed';
manifest.completedAt = new Date().toISOString();
writeJson(resolve(directory, 'manifest.json'), manifest);
writeJson(currentPath, manifest);
console.log(`Evidence: artifacts/runs/${runId}/manifest.json`);
process.exitCode = failed ? 1 : 0;
