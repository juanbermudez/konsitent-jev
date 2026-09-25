import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sourceInventory } from '../testing/source-inventory.mjs';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export function writeJson(path, value) {
  const temporary = `${path}.${process.pid}.tmp`;
  writeFileSync(temporary, JSON.stringify(value, null, 2) + '\n');
  renameSync(temporary, path);
}
export function inventory() {
  const entries = readdirSync(resolve(root, 'features'), { withFileTypes: true });
  if (!entries.length) throw new Error('No features discovered');
  const features = entries.map(e => {
    if (!e.isDirectory() || !/^[a-z0-9-]+$/.test(e.name)) throw new Error(`Invalid feature entry: ${e.name}`);
    return e.name;
  }).sort();
  for (const feature of features) {
    for (const file of ['main.ts', 'acceptance.e2e.ts', 'failure-modes.md']) {
      const path = resolve(root, 'features', feature, file);
      if (!lstatSync(path).isFile()) throw new Error(`Required regular file: ${feature}/${file}`);
      if (!readFileSync(path, 'utf8').trim()) throw new Error(`Empty required file: ${feature}/${file}`);
    }
  }
  sourceInventory(root, features);
  return features;
}
export function snapshot() {
  const hashes = {};
  function visit(path) {
    const full = resolve(root, path);
    const stat = lstatSync(full);
    if (stat.isSymbolicLink()) throw new Error(`Symlink in evidence scope: ${path}`);
    if (stat.isDirectory()) {
      for (const name of readdirSync(full).sort()) visit(`${path}/${name}`);
    } else if (stat.isFile()) hashes[path] = hash(readFileSync(full));
    else throw new Error(`Unsupported evidence input: ${path}`);
  }
  for (const path of ['features', 'testing', 'conventions', 'testing-policy.json', 'konsistent.json', 'package.json', 'pnpm-lock.yaml',
    'scripts/evidence.mjs', 'scripts/run-e2e.mjs', 'scripts/check-artifacts.mjs', 'scripts/check-policy.mjs']) visit(path);
  for (const path of sourceInventory(root, inventory()).files) if (!(path in hashes)) visit(path);
  return hashes;
}
