import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execute } from './implementation.ts';
import { createDatabase } from './store.ts';

test('transaction rollback leaves neither payment nor outbox event', async () => {
  const db = createDatabase();
  await assert.rejects(execute(db, { id: 'payment-42' }, () => { throw Error('transaction aborted'); }));
  assert.deepEqual(db.payments, []);
  assert.deepEqual(db.outbox, []);
  await execute(db, { id: 'payment-42' }, () => {});
  assert.equal(db.payments.length, 1);
  assert.equal(db.outbox.length, 1);
});
