import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execute } from './implementation.ts';

test('lost acknowledgement followed by retry creates one charge', async () => {
  const charges = new Map<string, { id: string; amount: number }>();
  let calls = 0;
  let keys = 0;
  const client = { async charge({ key, amount }: { key: string; amount: number }) {
    if (!charges.has(key)) charges.set(key, { id: String(charges.size + 1), amount });
    if (++calls === 1) throw Error('Response lost after charge committed');
    return charges.get(key);
  } };
  const result = await execute(client, () => `request-${++keys}`);
  assert.equal(calls, 2);
  assert.equal(charges.size, 1);
  assert.equal(result?.id, '1');
});
