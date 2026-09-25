import { existsSync, lstatSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

export function sourceInventory(root, features) {
  const policy = JSON.parse(readFileSync(resolve(root, 'testing-policy.json'), 'utf8'));
  if (!Array.isArray(policy.productionRoots) || !policy.productionRoots.length || !policy.owners || !policy.exemptions
    || !Array.isArray(policy.testSuffixes)) throw new Error('Invalid source inventory policy');
  const files = [];
  function walk(path) {
    const stat = lstatSync(resolve(root, path));
    if (stat.isSymbolicLink()) throw new Error(`Symlink in production inventory: ${path}`);
    if (stat.isDirectory()) {
      for (const name of readdirSync(resolve(root, path)).sort()) walk(`${path}/${name}`);
    } else if (/\.(?:[cm]?[jt]s|[jt]sx)$/.test(path) && !policy.testSuffixes.some(s => path.endsWith(s))) files.push(path);
  }
  for (const path of policy.productionRoots) {
    if (typeof path !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(path)) throw new Error('Production roots must be top-level directory names');
    if (existsSync(resolve(root, path))) walk(path);
  }
  for (const path of files) {
    const owner = policy.owners[path];
    const exemption = policy.exemptions[path];
    if (owner && exemption) throw new Error(`Ambiguous owner/exemption: ${path}`);
    if (owner && features.includes(owner)) continue;
    if (!owner && typeof exemption === 'string' && exemption.trim()) continue;
    throw new Error(`Unowned production file: ${path}`);
  }
  for (const path of [...Object.keys(policy.owners), ...Object.keys(policy.exemptions)]) {
    if (!files.includes(path)) throw new Error(`Stale inventory entry: ${path}`);
  }
  return { policy, files: files.sort() };
}
