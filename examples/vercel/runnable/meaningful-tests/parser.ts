export function parseEvent(raw: string) {
  const event = JSON.parse(raw);
  if (!event || typeof event.id !== 'string' || !event.id.trim()
    || !Number.isSafeInteger(event.amountCents) || event.amountCents <= 0) {
    throw new Error('invalid-event');
  }
  return { id: event.id, amountCents: event.amountCents };
}
