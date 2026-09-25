# Save the payment and outbox message together

If a transaction fails, neither the payment nor its outbox message should be
saved. The good version uses the transaction for both writes. The broken version
writes the outbox message directly to the database, so that message survives
even when the payment is rolled back.

The example store holds transaction writes until commit but saves direct writes
right away. Its test catches the broken version. **Jev flagged the good version
as broken in the latest live run**, which is why this repo treats Jev's answer as
feedback rather than proof.

Run `pnpm examples:advanced`, or add `--jev` for a live review. The example does
not connect to a database.
