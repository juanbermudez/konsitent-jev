import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseEvent } from './implementation.ts';

test('preserves payment identity and exact integer amount', () => {
  assert.deepEqual(parseEvent('{"id":"evt-42","amountCents":4200}'), {
    id: 'evt-42', amountCents: 4200,
  });
});

test('rejects malformed events before payment processing', () => {
  for (const raw of ['{', '{}', '{"id":"","amountCents":42}',
    '{"id":"evt-42","amountCents":-1}', '{"id":"evt-42","amountCents":1.5}']) {
    assert.throws(() => parseEvent(raw));
  }
});
