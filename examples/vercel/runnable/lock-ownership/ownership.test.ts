import { test } from 'node:test';
import assert from 'node:assert/strict';
import { releaseLock } from './implementation.ts';
import { createStore } from './store.ts';

test('owner can release its own lock', async () => {
  const store = createStore('owner-A');
  await releaseLock(store, { key: 'thread:42', token: 'owner-A' });
  assert.equal(store.currentOwner(), undefined);
});

test('stale owner cannot release an existing replacement', async () => {
  const store = createStore('owner-B');
  await releaseLock(store, { key: 'thread:42', token: 'owner-A' });
  assert.equal(store.currentOwner(), 'owner-B');
});

test('replacement between read and delete must survive', async () => {
  const store = createStore('owner-A');
  store.replaceOwnerAfterNextRead('owner-B');
  await releaseLock(store, { key: 'thread:42', token: 'owner-A' });
  // Atomic release makes no separate read: A is removed before a takeover.
  // A split release reads A, triggers takeover to B, then wrongly deletes B.
  if (store.ownershipChanged()) assert.equal(store.currentOwner(), 'owner-B');
  else assert.equal(store.currentOwner(), undefined);
});
