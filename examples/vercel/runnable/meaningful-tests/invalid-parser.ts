export function parseEvent(raw: string) {
  const event = JSON.parse(raw);
  return { id: event.id, amountCents: event.amountCents };
}
