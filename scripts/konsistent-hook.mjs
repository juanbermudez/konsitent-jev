import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function feedback(message) {
  console.log(JSON.stringify({
    decision: 'block',
    reason: message,
    hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: message },
  }));
}

try {
  const event = JSON.parse(readFileSync(0, 'utf8'));
  if (event.hook_event_name !== 'PostToolUse') throw new Error('Expected a PostToolUse event');
  const input = event.tool_input;
  let paths = [];
  if (['Write', 'Edit'].includes(event.tool_name) && typeof input?.file_path === 'string') {
    paths = [input.file_path];
  } else if (event.tool_name === 'apply_patch' && typeof input?.command === 'string') {
    paths = [...input.command.matchAll(/^\*\*\* (?:Add File|Update File|Delete File|Move to): (.+)$/gm)].map(match => match[1]);
  }
  // Check whole feature directories so a missing/deleted sibling is still detected.
  // Unknown payloads and shared/config edits fall back to a full check.
  const scopes = paths.map(path => {
    const absolute = resolve(event.cwd || root, path);
    const local = relative(root, absolute).replaceAll('\\', '/');
    if (isAbsolute(local) || local.startsWith('../')) return null;
    const match = /^features\/([a-zA-Z0-9_-]+)(?:\/|$)/.exec(local);
    return match ? `features/${match[1]}` : null;
  });
  const args = [resolve(root, 'node_modules/konsistent/dist/cli.js'), 'check', '--format=json'];
  if (scopes.length && scopes.every(Boolean)) {
    for (const scope of new Set(scopes)) args.push('--paths', scope);
  }
  const result = spawnSync(process.execPath, args, {
    cwd: root, encoding: 'utf8', timeout: 8000, maxBuffer: 1024 * 1024,
    env: { ...process.env, KONSISTENT_NO_UPDATE_CHECK: 'true' },
  });
  if (result.error) throw result.error;
  let diagnostics;
  try { diagnostics = JSON.parse(result.stdout); } catch {
    throw new Error(`Checker did not return JSON: ${result.stderr || result.stdout}`);
  }
  if (!Array.isArray(diagnostics)) throw new Error('Unexpected checker output');
  if (result.status !== 0 && diagnostics.length === 0) {
    throw new Error(`Checker failed (${result.status}): ${result.stderr}`);
  }
  if (result.status !== 0) {
    const lines = diagnostics.slice(0, 20).map(d => `${d.filePath}: [${d.conventionName}] ${d.message}`);
    feedback(`Konsistent found convention violations. The edit already happened; repair these before finishing:\n${lines.join('\n')}`);
  } else {
    const policy = spawnSync(process.execPath, [resolve(root, 'scripts/check-policy.mjs')], {
      cwd: root, encoding: 'utf8', timeout: 8000, maxBuffer: 1024 * 1024,
    });
    if (policy.error) throw policy.error;
    if (policy.status !== 0) feedback(`Scenario policy rejected this edit: ${(policy.stderr || policy.stdout).trim()}\nRepair the scenario data or source ownership entry, then run pnpm check. Scenario files must contain only the shared type import and literal scenarios; each scenario must exercise distinct input/output behavior.`);
  }
} catch (error) {
  feedback(`Konsistent could not check this edit: ${error.message}. Fix the checker/setup error and run pnpm check; this is not a clean result.`);
}
