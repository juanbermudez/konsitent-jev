import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const dir=mkdtempSync(resolve(tmpdir(),'konsitent-consumer-'));
const pnpm=process.env.npm_execpath;
if(!pnpm) throw Error('Run with pnpm test:package');
const report=[];
function run(command,args,cwd=dir,options={}) {
  const r=spawnSync(command,args,{cwd,encoding:'utf8',timeout:120000,maxBuffer:2*1024*1024,...options});
  if(r.error) throw r.error;
  return r;
}
function record(name,fn) {fn();report.push({name,passed:true});console.log(`PASS ${name}`);}
try {
  const packed=run(process.execPath,[pnpm,'pack','--pack-destination','artifacts/package'],root);
  assert.equal(packed.status,0,packed.stderr);
  writeFileSync(resolve(dir,'package.json'),JSON.stringify({name:'consumer-test',private:true,type:'module'}));
  const installed=run(process.execPath,[pnpm,'add','--ignore-scripts','--prefer-offline',resolve(root,'artifacts/package/konsitent-jev-0.1.0.tgz')]);
  assert.equal(installed.status,0,installed.stderr);
  const cli=resolve(dir,'node_modules/konsitent-jev/src/cli.mjs');
  writeFileSync(resolve(dir,'implementation.ts'),'export function execute() { return 1; }');
  writeFileSync(resolve(dir,'implementation.test.ts'),"import { execute } from './implementation.ts'; execute();");
  writeFileSync(resolve(dir,'konsistent.json'),JSON.stringify({version:'v1',conventionSources:{jev:'konsitent-jev'},conventions:[{use:'jev/module-has-test',paths:'implementation.ts',placeholders:{module:'implementation'}},{use:'jev/module-export',paths:'implementation.ts',placeholders:{functionName:'execute'}}]}));
  const config={version:1,rules:[{id:'behavior',requirement:'execute returns 1',files:['implementation.ts']}]};
  writeFileSync(resolve(dir,'konsitent-jev.json'),JSON.stringify(config));
  record('installed tarball resolves native convention export',()=>assert.equal(run(process.execPath,[cli,'check','--dry-run']).status,0));
  record('missing API key is an error, not approval',()=> {
    const env={...process.env};delete env.TYPESAFE_API_KEY;
    const r=run(process.execPath,[cli,'check'],dir,{env});assert.equal(r.status,2);assert.match(r.stderr,/TYPESAFE_API_KEY/);
  });
  record('out-of-project context is rejected',()=> {
    writeFileSync(resolve(dir,'konsitent-jev.json'),JSON.stringify({...config,rules:[{...config.rules[0],files:['../outside.ts']}]}));
    const r=run(process.execPath,[cli,'check','--dry-run']);assert.equal(r.status,2);assert.match(r.stderr,/inside the project/);
    writeFileSync(resolve(dir,'konsitent-jev.json'),JSON.stringify(config));
  });
  record('structural failure prevents model evaluation',()=> {
    writeFileSync(resolve(dir,'implementation.ts'),'const execute = 1;');
    const r=run(process.execPath,[cli,'check']);assert.equal(r.status,1);assert.equal(JSON.parse(r.stdout).status,'structural_failure');
  });
  record('hook returns actionable structural feedback',()=> {
    const r=run(process.execPath,[cli,'hook'],dir,{input:JSON.stringify({hook_event_name:'PostToolUse'})});assert.equal(r.status,0);
    assert.match(JSON.parse(r.stdout).hookSpecificOutput.additionalContext,/structural_failure/);
  });
} finally {
  mkdirSync(resolve(root,'artifacts/package'),{recursive:true});
  writeFileSync(resolve(root,'artifacts/package/consumer-results.json'),JSON.stringify(report,null,2)+'\n');
  rmSync(dir,{recursive:true,force:true});
}
