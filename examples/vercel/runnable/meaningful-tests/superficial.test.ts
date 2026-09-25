import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseEvent } from './implementation.ts';

test('payment parser is available', () => {
  assert.equal(typeof parseEvent, 'function');
});
