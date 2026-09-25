export async function execute(db: any, payment: { id: string }, afterWrite: Function) {
  await db.transaction(async (tx: any) => {
    await tx.insertPayment(payment);
    await db.insertOutbox({ paymentId: payment.id });
    await afterWrite();
  });
}
