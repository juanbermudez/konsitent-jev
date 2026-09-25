#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { reviewRule, validateConfig, loadFiles } from './review.mjs';

const args = process.argv.slice(2);
const root = process.cwd();
const hook = args[0] === 'hook';
function output(report) {
  if (!hook) return console.log(JSON.stringify(report,null,2));
  const message = report.results
    ? report.results.map(r => `[${r.ruleId}] ${r.verdict ?? r.status}: ${r.guidance ?? ''}`).join('\n')
    : JSON.stringify(report);
  console.log(JSON.stringify({hookSpecificOutput:{hookEventName:'PostToolUse',additionalContext:`konsitent-jev advisory review:\n${message}`}}));
}
function value(flag, fallback) {
  const index = args.indexOf(flag);
  if (index < 0) return fallback;
  if (!args[index+1] || args[index+1].startsWith('--')) throw Error(`Missing value for ${flag}`);
  return args[index+1];
}
try {
  if (!['check','hook'].includes(args[0]) || args.includes('--help')) {
    console.log('konsitent-jev check|hook [--config konsitent-jev.json] [--structural-config konsistent.json] [--dry-run] [--strict]\nRuns Konsistent, then advisory Jev rules. --strict exits 1 on contradiction, 2 on uncertainty. Dry-run makes no API calls.');
    if (!['check','hook'].includes(args[0]) && !args.includes('--help')) process.exitCode=2;
  } else {
    if (hook && JSON.parse(readFileSync(0,'utf8')).hook_event_name !== 'PostToolUse') throw Error('Expected PostToolUse event');
    const allowed = new Set(['--config','--structural-config','--dry-run','--strict']);
    for (let i=1;i<args.length;i++) {
      if (!allowed.has(args[i])) throw Error(`Unknown argument: ${args[i]}`);
      if (['--config','--structural-config'].includes(args[i])) i++;
    }
    const configPath = resolve(root,value('--config','konsitent-jev.json'));
    const config = validateConfig(JSON.parse(readFileSync(configPath,'utf8')));
    const require = createRequire(import.meta.url);
    const konsistent = resolve(dirname(require.resolve('konsistent/package.json')),'dist/cli.js');
    const structure = spawnSync(process.execPath,[konsistent,'check','--format=json','--config-path',resolve(root,value('--structural-config','konsistent.json'))],{
      cwd:root,encoding:'utf8',timeout:20000,maxBuffer:1024*1024,env:{...process.env,KONSISTENT_NO_UPDATE_CHECK:'true'},
    });
    if (structure.error || structure.signal) throw structure.error ?? Error(structure.signal);
    if (structure.status !== 0) {
      output({status:'structural_failure',diagnostics:structure.stdout,detail:structure.stderr});
      process.exitCode=hook?0:1;
    } else {
      const report = { package:'konsitent-jev', mode:args.includes('--strict')?'strict':'advisory', structuralDiagnostics:JSON.parse(structure.stdout), results:[] };
      for (const rule of config.rules) {
        if (args.includes('--dry-run')) {
          loadFiles(root,rule.files);
          if (rule.contextFiles) loadFiles(root,rule.contextFiles);
          report.results.push({ruleId:rule.id,status:'validated_no_model_call'});
        } else report.results.push(await reviewRule(root,rule,config.model));
      }
      output(report);
      if (!hook && args.includes('--strict')) {
        if (report.results.some(r=>r.verdict==='insufficient_evidence')) process.exitCode=2;
        else if (report.results.some(r=>r.verdict==='contradicted')) process.exitCode=1;
      }
    }
  }
} catch (error) {
  const report={status:'error',message:error.message};
  if(hook) output(report); else console.error(JSON.stringify(report));
  process.exitCode=hook?0:2;
}
