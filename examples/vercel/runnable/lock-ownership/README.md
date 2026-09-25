# An ownership check can still have a race

Requirement: the current owner can release its lock; a stale owner cannot delete
another owner's lock.

[atomic.ts](atomic.ts) delegates to one atomic compare-and-delete operation.
[racy.ts](racy.ts) reads the token, then deletes in a separate operation. Both
export the required function and have the same behavioral test.

The [store](store.ts) creates a deterministic interleaving, without sleeps:

1. Owner A starts releasing its lock.
2. The split implementation reads A's token.
3. The store replaces ownership with B before returning that read.
4. A's implementation deletes the key using its stale result.
5. The test observes that B's lock disappeared.

The atomic variant has no separate read at which this takeover can occur. Its
comparison and deletion happen in one operation. Other tests verify ordinary
release and rejection of a token belonging to an already-replaced owner.

[ownership.test.ts](ownership.test.ts) executes both variants through the same
interface. Jev receives the store's semantics and source, so it can judge atomicity
without assuming a helper's behavior.

This is an executable scheduling model, not a live Redis integration test. It
illustrates the ownership rule behind Chat SDK's
[atomic Redis release](https://github.com/vercel/chat/blob/main/packages/state-redis/src/index.ts).
