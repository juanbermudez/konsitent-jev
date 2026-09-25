import { deepStrictEqual, equal } from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { readScenarios } from './read-scenarios.mjs';

// A bounded child process isolates import errors, hangs, and premature exits.
const feature = process.argv[2];
const root = process.cwd();
const scenarios = readScenarios(resolve(root, `features/${feature}/acceptance.e2e.ts`));
if (!Array.isArray(scenarios) || scenarios.length === 0) throw new Error('scenarios must be a nonempty array');
const names = new Set();
for (const s of scenarios) {
  if (!s || typeof s !== 'object' || typeof s.name !== 'string' || !s.name.trim()
    || names.has(s.name) || !Object.hasOwn(s, 'input') || !Object.hasOwn(s, 'expected')
    || s.expected === undefined || (s.rawInput !== undefined && typeof s.rawInput !== 'string')
    || !Number.isInteger(s.exitCode ?? 0) || (s.exitCode ?? 0) < 0 || (s.exitCode ?? 0) > 255) {
    throw new Error('Invalid scenario or duplicate scenario name');
  }
  names.add(s.name);
}
const records = scenarios.map(s => {
  const stdin = s.rawInput ?? JSON.stringify(s.input);
  const args = ['--experimental-strip-types', `features/${feature}/main.ts`];
  const r = spawnSync(process.execPath, args, { cwd: root, input: stdin, encoding: 'utf8', timeout: 5000, maxBuffer: 1024 * 1024 });
  let passed = false;
  let failure;
  try {
    if (r.error) throw r.error;
    equal(r.status, s.exitCode ?? 0);
    deepStrictEqual(JSON.parse(r.stdout), s.expected);
    passed = true;
  } catch (error) { failure = error.message; }
  return { name: s.name, stdin, expected: s.expected, expectedExitCode: s.exitCode ?? 0,
    command: ['node', ...args], stdout: r.stdout, stderr: r.stderr, actualExitCode: r.status,
    signal: r.signal, passed, ...(failure ? { failure } : {}) };
});
console.log(JSON.stringify({ feature, passed: records.every(r => r.passed), scenarios: records }));
