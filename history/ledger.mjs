import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, lstatSync, mkdirSync, readFileSync, rmdirSync } from 'node:fs';
import { isAbsolute, resolve, relative } from 'node:path';

const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const location = root => resolve(root, 'artifacts/history/events.jsonl');
export function readLedger(root) {
  if (!existsSync(location(root))) return [];
  const events = readFileSync(location(root), 'utf8').trim().split('\n').map(JSON.parse);
  let previous = null;
  for (const [index, event] of events.entries()) {
    const { hash, ...body } = event;
    if (body.sequence !== index || body.previous !== previous || hash !== digest(body)) throw Error('History ledger is inconsistent');
    previous = hash;
  }
  return events;
}
function append(root, events, data) {
  const body = { sequence: events.length, previous: events.at(-1)?.hash ?? null, time: new Date().toISOString(), ...data };
  appendFileSync(location(root), JSON.stringify({ ...body, hash: digest(body) }) + '\n');
}
function locked(root, fn) {
  const directory = resolve(root, 'artifacts/history');
  mkdirSync(directory, { recursive: true });
  const lock = resolve(directory, 'lock');
  try { mkdirSync(lock); } catch { throw Error('History recorder busy or interrupted; reconcile before continuing'); }
  try { return fn(); } finally { rmdirSync(lock); }
}
export function snapshot(root, task) {
  const files = {};
  for (const path of [...task.implementation, ...task.tests, ...task.plans]) {
    if (typeof path !== 'string' || isAbsolute(path) || path.split(/[\\/]/).some(p => p === '..' || p === '.') || !path.length) throw Error('Task paths must be repository-relative');
    const full = resolve(root, path);
    if (relative(root, full).startsWith('..')) throw Error('Path outside repository');
    let cursor = root;
    for (const part of path.split('/')) {
      cursor = resolve(cursor, part);
      if (existsSync(cursor) && lstatSync(cursor).isSymbolicLink()) throw Error(`Symlink not allowed: ${path}`);
    }
    if (!existsSync(full)) { files[path] = null; continue; }
    const stat = lstatSync(full);
    if (!stat.isFile() || stat.size > 128 * 1024) throw Error(`History requires regular files under 128 KiB: ${path}`);
    const content = readFileSync(full, 'utf8');
    files[path] = { hash: digest(content), content };
  }
  return files;
}
export function start(root, task) {
  if (!task || typeof task.requirement !== 'string' || !task.requirement.trim()
    || ['implementation', 'tests', 'plans'].some(k => !Array.isArray(task[k]) || !task[k].length)) throw Error('Task needs requirement and nonempty implementation/tests/plans path lists');
  const paths = [...task.implementation, ...task.tests, ...task.plans];
  if (new Set(paths).size !== paths.length) throw Error('Task paths must be distinct');
  return locked(root, () => {
    const events = readLedger(root);
    if (events.length) throw Error('A history task already exists; use a separate checkout for a new task');
    append(root, events, { type: 'start', task, snapshot: snapshot(root, task) });
  });
}
export function record(root, input) {
  if (!existsSync(location(root))) return; // Opt-in task, no hidden recording.
  return locked(root, () => {
    const events = readLedger(root);
    const task = events[0].task;
    const current = snapshot(root, task);
    const id = input.tool_use_id ?? input.tool_call_id ?? null;
    const previous = events.at(-1);
    const phase = input.hook_event_name;
    if (phase === 'PreToolUse') {
      const gap = !id || !['start', 'post'].includes(previous.type) || digest(current) !== digest(previous.snapshot);
      append(root, events, { type: 'pre', id, gap, snapshot: current });
    } else if (phase === 'PostToolUse') {
      const gap = !id || previous.type !== 'pre' || previous.id !== id;
      append(root, events, { type: 'post', id, gap, snapshot: current });
    } else throw Error('Unsupported history hook event');
  });
}
export function chronology(root) {
  const events = readLedger(root);
  if (!events.length) return { status: 'insufficient_evidence', reason: 'Recording has not started' };
  const task = events[0].task;
  if (events.some(e => e.gap) || !['start', 'post'].includes(events.at(-1).type)
    || digest(snapshot(root, task)) !== digest(events.at(-1).snapshot)) {
    return { status: 'insufficient_evidence', reason: 'Unobserved, overlapping, incomplete, or changed edits', task };
  }
  const edits = events.filter(e => e.type === 'post').map(e => ({ ...e, before: events[e.sequence - 1].snapshot }));
  const implementation = edits.find(e => task.implementation.some(p => e.before[p]?.hash !== e.snapshot[p]?.hash));
  if (!implementation) return { status: 'insufficient_evidence', reason: 'No implementation edit observed', task };
  const prerequisites = {};
  for (const kind of ['tests', 'plans']) {
    // Freeze evidence at the first implementation edit: subsequent edits cannot repair history.
    const earlier = edits.filter(e => e.sequence < implementation.sequence);
    const prior = [...earlier].reverse().find(e => task[kind].some(p => e.snapshot[p]?.content.trim() && e.before[p]?.hash !== e.snapshot[p]?.hash));
    if (!prior) {
      const existed = task[kind].some(p => events[0].snapshot[p]?.content.trim());
      return { status: existed ? 'insufficient_evidence' : 'order_violation', reason: `${kind}: no observed substantive-file edit before implementation`, task, implementationSequence: implementation.sequence };
    }
    const before = implementation.before;
    if (!task[kind].some(p => before[p]?.content.trim())) return { status: 'order_violation', reason: `${kind} removed before implementation`, task };
    prerequisites[kind] = Object.fromEntries(task[kind].map(p => [p, before[p]?.content ?? '']));
  }
  return { status: 'order_observed', task, implementationSequence: implementation.sequence,
    evidence: { requirement: task.requirement, ...prerequisites,
      implementationBefore: Object.fromEntries(task.implementation.map(p => [p, implementation.before[p]?.content ?? ''])),
      implementationAfter: Object.fromEntries(task.implementation.map(p => [p, implementation.snapshot[p]?.content ?? ''])) } };
}
