import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createProvider } from './implementation.ts';

test('uses supplied transport and endpoint for the actual request', async () => {
  const calls: { url: string; init?: RequestInit }[] = [];
  const suppliedFetch: typeof fetch = async (input, init) => {
    calls.push({ url: String(input), init });
    return new Response('{"text":"answer"}', { status: 200 });
  };
  const originalFetch = globalThis.fetch;
  // This sentinel also ensures a flawed example cannot send a network request.
  globalThis.fetch = async () => { throw new Error('Unexpected default transport'); };
  try {
    const provider = createProvider({ baseURL: 'https://tenant.invalid/custom/', fetch: suppliedFetch });
    const response = await provider.generate('hello');
    assert.deepEqual(await response.json(), { text: 'answer' });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'https://tenant.invalid/custom/generate');
    assert.equal(calls[0].init?.method, 'POST');
    assert.deepEqual(JSON.parse(String(calls[0].init?.body)), { prompt: 'hello' });
  } finally { globalThis.fetch = originalFetch; }
});
