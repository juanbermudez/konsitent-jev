import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { start, record, chronology, readLedger } from '../history/ledger.mjs';
import { review } from '../history/jev.mjs';

const root = process.cwd();
let hookEvent = 'PostToolUse';
function feedback(message) {
  console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: hookEvent, additionalContext: message } }));
}
async function assess(result) {
  const ledger = readLedger(root);
  const head = ledger.at(-1).hash;
  if (result.status === 'order_observed') result.semanticReview = await review(result.evidence);
  // A network call must not attach a verdict to a changed task.
  if (readLedger(root).at(-1).hash !== head || JSON.stringify(chronology(root)) !== JSON.stringify({ ...result, semanticReview: undefined })) {
    throw Error('History changed during review; run again');
  }
  result.ledgerHead = head;
  writeFileSync(resolve(root, `artifacts/history/review-${head}.json`), JSON.stringify(result,null,2)+'\n');
  return result;
}
try {
  const command = process.argv[2];
  if (command === 'start') {
    start(root, JSON.parse(readFileSync(resolve(root, process.argv[3]), 'utf8')));
    console.log('History recording started. Baseline content has unknown authorship order.');
  } else if (command === 'hook') {
    const event = JSON.parse(readFileSync(0, 'utf8'));
    hookEvent = event.hook_event_name;
    record(root, event);
    if (readLedger(root).length && hookEvent === 'PostToolUse') {
      const result = chronology(root);
      if (result.status !== 'order_observed') feedback(`Chronology: ${result.status}. ${result.reason}. Do not rewrite recorded history to clear this result.`);
      else if (process.env.JEV_HISTORY_REVIEW === '1' && result.implementationSequence === readLedger(root).at(-1).sequence) {
        await assess(result);
        const judgments = Object.entries(result.semanticReview.result.answers).map(([key,a]) => `${key}: ${a.choice} (confidence ${a.confidence})`).join('; ');
        feedback(`Observed prerequisite edits before implementation. Jev advisory: ${judgments}. Inadequate prerequisites need substantive assertions/failure analysis; insufficient evidence needs helper or requirement context. This is not proof of test execution or complete coverage.`);
      }
    }
  } else if (command === 'check') {
    const result = chronology(root);
    if (process.argv.includes('--jev') && result.status === 'order_observed') await assess(result);
    console.log(JSON.stringify(result, null, 2));
    if (result.status !== 'order_observed') process.exitCode = 2;
  } else throw Error('Usage: history.mjs start <task.json> | hook | check [--jev]');
} catch (error) {
  if (process.argv[2] === 'hook') feedback(`History unavailable: ${error.message}. Chronology is not verified.`);
  else console.error(error.message);
  process.exitCode = process.argv[2] === 'hook' ? 0 : 2;
}
