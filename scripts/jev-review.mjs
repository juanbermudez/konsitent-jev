import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { review, questions } from '../history/jev.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const cases = JSON.parse(readFileSync(resolve(root, 'examples/jev/cases.json')));
const output = resolve(root, 'artifacts/jev');
mkdirSync(output, { recursive: true });
const results = [];
const report = { startedAt: new Date().toISOString(), mode: 'advisory', results };
const path = resolve(output, `${report.startedAt.replaceAll(':','-')}.json`);
if (process.argv.includes('--dry-run')) {
  writeFileSync(resolve(output,'requests.json'),JSON.stringify(cases.map(c => ({state:c.state,questions})),null,2)+'\n');
  console.log(`PASS ${cases.length} request contexts; no API calls`);
} else {
  for (const c of cases) {
    try {
      const response = await review(c.state);
      const actual = Object.fromEntries(Object.entries(response.result.answers).map(([key,a]) => [key,a.choice]));
      const matched = Object.entries(c.expected).every(([key,value]) => actual[key] === value);
      results.push({ id:c.id, expected:c.expected, actual, matched, ...response });
      console.log(`${matched ? 'MATCH' : 'MISMATCH'} ${c.id}: ${JSON.stringify(actual)}`);
    } catch (error) {
      results.push({id:c.id,error:error.message});
      console.error(`ERROR ${c.id}: ${error.message}`);
      process.exitCode=2;
      break;
    } finally {
      writeFileSync(path,JSON.stringify(report,null,2)+'\n');
    }
  }
  report.summary={total:cases.length,attempted:results.length,matched:results.filter(r=>r.matched).length,mismatched:results.filter(r=>r.matched===false).length,errors:results.filter(r=>r.error).length};
  writeFileSync(path,JSON.stringify(report,null,2)+'\n');
  if (report.summary.mismatched) process.exitCode=1;
  console.log(JSON.stringify(report.summary));
  console.log(path);
}
