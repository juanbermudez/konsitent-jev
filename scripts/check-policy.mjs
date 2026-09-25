import { resolve } from 'node:path';
import { inventory, root } from './evidence.mjs';
import { readScenarios } from '../testing/read-scenarios.mjs';

try {
  const features = inventory();
  for (const feature of features) {
    const path = `features/${feature}/acceptance.e2e.ts`;
    try { readScenarios(resolve(root, path)); }
    catch (error) { throw new Error(`${path}: ${error.message}`); }
  }
  console.log(`PASS scenario policy: ${features.length} feature(s)`);
} catch (error) {
  console.error(`FAIL scenario policy: ${error.message}`);
  process.exitCode = 1;
}
