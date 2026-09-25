// Explicit transaction model: tx writes stage; root writes commit immediately.
export function createDatabase() {
  const payments: unknown[] = [];
  const outbox: unknown[] = [];
  return {
    payments, outbox,
    async insertOutbox(row: unknown) { outbox.push(row); },
    async transaction(work: Function) {
      const stagedPayments: unknown[] = [];
      const stagedOutbox: unknown[] = [];
      await work({
        async insertPayment(row: unknown) { stagedPayments.push(row); },
        async insertOutbox(row: unknown) { stagedOutbox.push(row); },
      });
      payments.push(...stagedPayments);
      outbox.push(...stagedOutbox);
    },
  };
}
