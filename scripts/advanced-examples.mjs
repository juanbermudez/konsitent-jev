import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../',import.meta.url));
const cases = JSON.parse(readFileSync(resolve(root,'examples/advanced/cases.json')));
const live = process.argv.includes('--jev');
const report = { startedAt:new Date().toISOString(),liveJev:live,results:[] };
const out = resolve(root,'artifacts/advanced');mkdirSync(out,{recursive:true});
const reportPath=resolve(out,`${report.startedAt.replaceAll(':','-')}.json`);
for (const c of cases) {
  const dir=mkdtempSync(resolve(tmpdir(),'konsitent-advanced-'));
  try {
    for (const [target,source] of Object.entries(c.files)) writeFileSync(resolve(dir,target),readFileSync(resolve(root,'examples/advanced',source)));
    mkdirSync(resolve(dir,'node_modules'));
    symlinkSync(root,resolve(dir,'node_modules/konsitent-jev'),'dir');
    writeFileSync(resolve(dir,'konsistent.json'),JSON.stringify({version:'v1',conventionSources:{jev:'konsitent-jev'},conventions:[
      {use:'jev/module-export',paths:'implementation.ts',placeholders:{functionName:'execute'}},
      {use:'jev/module-has-test',paths:'implementation.ts',placeholders:{module:'implementation'}},
      {use:'jev/test-imports-module',paths:'implementation.test.ts',placeholders:{module:'implementation'}}
    ]}));
    writeFileSync(resolve(dir,'konsitent-jev.json'),JSON.stringify({version:1,model:'jev-1.13.0',rules:[{id:'contract',requirement:c.requirement,targetFiles:['implementation.ts'],files:c.semanticFiles,...(c.contextFiles?{contextFiles:c.contextFiles}:{})}]}));
    const checked=spawnSync(process.execPath,[resolve(root,'src/cli.mjs'),'check',...(live?['--strict']:['--dry-run'])],{cwd:dir,encoding:'utf8',timeout:45000,maxBuffer:2*1024*1024});
    if(checked.error) throw checked.error;
    const check=JSON.parse(checked.stdout);
    assert.ok(Array.isArray(check.results),checked.stderr||checked.stdout);
    assert.equal(checked.status,!live?0:check.results[0].verdict==='contradicted'?1:check.results[0].verdict==='insufficient_evidence'?2:0,checked.stderr||checked.stdout);
    const execution=spawnSync(process.execPath,['--experimental-strip-types','--test','implementation.test.ts'],{cwd:dir,encoding:'utf8',timeout:15000});
    assert.equal(execution.status,c.runtimeExit,execution.stdout+execution.stderr);
    if(c.runtimeExit===1) assert.match(execution.stdout,/ERR_ASSERTION/);
    const matched=!live||check.results[0].verdict===c.expected;
    if(!matched) process.exitCode=1;
    report.results.push({id:c.id,expected:c.expected,matched,check,execution:{exitCode:execution.status,stdout:execution.stdout,stderr:execution.stderr}});
    console.log(`${matched?'PASS':'MISMATCH'} ${c.id}: runtime=${execution.status}${live?`, Jev=${check.results[0].verdict}, stages=${check.results[0].stages.length}`:''}`);
  } catch(error) { report.results.push({id:c.id,error:error.message});process.exitCode=1;console.error(`FAIL ${c.id}: ${error.message}`); }
  finally {rmSync(dir,{recursive:true,force:true});writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');}
}
report.summary={total:cases.length,passed:report.results.filter(r=>r.matched).length,errors:report.results.filter(r=>r.error).length};
writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report.summary));console.log(reportPath);
