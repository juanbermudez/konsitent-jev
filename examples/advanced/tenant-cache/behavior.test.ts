import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execute } from './implementation.ts';

test('identical object IDs in different tenants never share cached values', async () => {
  const cache = new Map<string, unknown>();
  let loads = 0;
  const load = async (tenant: string, id: string) => { loads++; return { tenant, id, secret: `${tenant}-private` }; };
  const first = await execute(cache, 'tenant-A', 'invoice-42', load);
  const second = await execute(cache, 'tenant-B', 'invoice-42', load);
  assert.deepEqual(first, { tenant: 'tenant-A', id: 'invoice-42', secret: 'tenant-A-private' });
  assert.deepEqual(second, { tenant: 'tenant-B', id: 'invoice-42', secret: 'tenant-B-private' });
  assert.deepEqual(await execute(cache, 'tenant-A', 'invoice-42', load), first);
  assert.equal(loads, 2);
});
