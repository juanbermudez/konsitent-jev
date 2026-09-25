import type { Scenario } from '../../testing/scenario.ts';

export const scenarios: readonly Scenario[] = [
  { name: 'discounted-cart', input: { items: [{ sku: 'notebook', quantity: 2 }, { sku: 'pen', quantity: 3 }], coupon: 'SAVE10' },
    expected: { subtotalCents: 3300, discountCents: 330, totalCents: 2970 } },
  { name: 'duplicate-lines', input: { items: [{ sku: 'notebook', quantity: 3 }, { sku: 'notebook', quantity: 2 }] },
    expected: { error: 'out-of-stock' }, exitCode: 1 },
  { name: 'invalid-coupon', input: { items: [{ sku: 'pen', quantity: 1 }], coupon: 'FREE' },
    expected: { error: 'invalid-coupon' }, exitCode: 1 },
  { name: 'unknown-sku', input: { items: [{ sku: 'missing', quantity: 1 }] }, expected: { error: 'unknown-sku' }, exitCode: 1 },
  { name: 'empty-cart', input: { items: [] }, expected: { error: 'invalid-request' }, exitCode: 1 },
  { name: 'invalid-quantity', input: { items: [{ sku: 'pen', quantity: -1 }] }, expected: { error: 'invalid-request' }, exitCode: 1 },
  { name: 'invalid-request', input: null, rawInput: '{', expected: { error: 'invalid-request' }, exitCode: 1 },
];
