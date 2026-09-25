import { readFileSync } from 'node:fs';

const catalog: Record<string, { price: number; stock: number }> = {
  notebook: { price: 1200, stock: 4 },
  pen: { price: 300, stock: 10 },
};

function checkout(request: unknown) {
  if (!request || typeof request !== 'object') throw new Error('invalid-request');
  const { items, coupon } = request as { items?: unknown; coupon?: unknown };
  if (!Array.isArray(items) || items.length === 0) throw new Error('invalid-request');
  const quantities = new Map<string, number>();
  for (const item of items) {
    if (!item || typeof item.sku !== 'string' || !Number.isSafeInteger(item.quantity) || item.quantity <= 0) {
      throw new Error('invalid-request');
    }
    if (!Object.hasOwn(catalog, item.sku)) throw new Error('unknown-sku');
    const quantity = (quantities.get(item.sku) ?? 0) + item.quantity;
    if (quantity > catalog[item.sku].stock) throw new Error('out-of-stock');
    quantities.set(item.sku, quantity);
  }
  if (coupon !== undefined && coupon !== 'SAVE10') throw new Error('invalid-coupon');
  const subtotalCents = [...quantities].reduce((sum, [sku, quantity]) => sum + catalog[sku].price * quantity, 0);
  const discountCents = coupon === 'SAVE10' ? Math.round(subtotalCents * 0.1) : 0;
  return { subtotalCents, discountCents, totalCents: subtotalCents - discountCents };
}

let request: unknown;
try {
  request = JSON.parse(readFileSync(0, 'utf8'));
} catch {
  console.log(JSON.stringify({ error: 'invalid-request' }));
  process.exit(1);
}
try {
  console.log(JSON.stringify(checkout(request)));
} catch (error) {
  console.log(JSON.stringify({ error: error instanceof Error ? error.message : 'unknown-error' }));
  process.exitCode = 1;
}
