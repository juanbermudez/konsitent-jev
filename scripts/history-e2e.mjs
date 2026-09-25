import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const cli = resolve(root, 'scripts/history.mjs');
const task = JSON.parse(readFileSync(resolve(root, 'examples/history/task.json')));
const context = JSON.parse(readFileSync(resolve(root, 'examples/history/context.json')));
const results = [];
function scenario(name, setup, expected) {
  const directory = mkdtempSync(resolve(tmpdir(), 'chronology-'));
  const put = (path, text) => { mkdirSync(dirname(resolve(directory, path)), { recursive: true }); writeFileSync(resolve(directory,path), text); };
  const run = (args, event) => {
    const result = spawnSync(process.execPath, [cli, ...args], { cwd: directory, encoding: 'utf8', input: event ? JSON.stringify(event) : undefined });
    assert.equal(result.error, undefined);
    return result;
  };
  let id = 0;
  const edit = (files) => {
    const tool_use_id = String(++id);
    assert.equal(run(['hook'], { hook_event_name: 'PreToolUse', tool_use_id }).status, 0);
    for (const [p, text] of Object.entries(files)) put(p,text);
    assert.equal(run(['hook'], { hook_event_name: 'PostToolUse', tool_use_id }).status, 0);
  };
  try {
    put('task.json', JSON.stringify(task));
    assert.equal(run(['start','task.json']).status,0);
    setup({ put, edit, run, directory });
    const checked = run(['check']);
    const result = JSON.parse(checked.stdout);
    assert.equal(result.status, expected, checked.stdout);
    results.push({ name, expected, status: result.status });
    console.log(`PASS ${name}: ${result.status}`);
  } finally { rmSync(directory,{recursive:true,force:true}); }
}
const impl = context.implementationAfter;
const prerequisites = {...context.plans,...context.tests};
scenario('plan and tests precede implementation', ({edit}) => {edit(context.plans);edit(context.tests);edit(impl);},'order_observed');
scenario('implementation before tests', ({edit}) => {edit(impl);edit(prerequisites);},'order_violation');
scenario('same patch cannot establish order', ({edit}) => edit({...prerequisites,...impl}),'order_violation');
scenario('shell edit between hooks is a gap', ({put,edit}) => {put(task.plans[0],'unobserved plan');edit(context.tests);edit(impl);},'insufficient_evidence');
scenario('interrupted edit', ({run}) => run(['hook'],{hook_event_name:'PreToolUse',tool_use_id:'pending'}),'insufficient_evidence');
scenario('post without pre', ({put,run}) => {put(task.implementation[0],'code');run(['hook'],{hook_event_name:'PostToolUse',tool_use_id:'unknown'});},'insufficient_evidence');
scenario('placeholder order requires semantic review', ({edit}) => {edit({[task.plans[0]]:'TODO',[task.tests[0]]:'test.skip("TODO", () => {});'});edit(impl);},'order_observed');
scenario('later unobserved changes invalidate review', ({edit,put}) => {edit(prerequisites);edit(impl);put(task.tests[0],'changed outside hooks');},'insufficient_evidence');
scenario('tampered ledger is rejected', ({directory,run}) => {
  const path = resolve(directory,'artifacts/history/events.jsonl');
  writeFileSync(path,readFileSync(path,'utf8').replace('idempotently','unsafely'));
  assert.equal(run(['check']).status,2);
  // Restore the bytes so the outer assertion can evaluate the untouched baseline.
  writeFileSync(path,readFileSync(path,'utf8').replace('unsafely','idempotently'));
},'insufficient_evidence');
mkdirSync(resolve(root,'artifacts/history'),{recursive:true});
writeFileSync(resolve(root,'artifacts/history/fixture-results.json'),JSON.stringify(results,null,2)+'\n');
