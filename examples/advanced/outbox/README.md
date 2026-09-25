# Transactional outbox

The requirement is all-or-nothing payment and outbox insertion. The correct
implementation uses the transaction object for both writes; the flawed one calls
the root database for the outbox write. A failure after both writes must leave
neither record. The supplied store stages transaction writes and commits root
writes immediately.

Runtime tests distinguish both implementations. **Jev falsely flagged the correct
variant in the latest live run.** This example deliberately retains that finding;
model confidence and structural validity cannot replace execution evidence.

Run `pnpm examples:advanced` (local transaction model) or add `--jev`. No live
database was used.
