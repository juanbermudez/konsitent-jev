# Checking a lock is not the same as releasing it safely

The current owner should be able to release its lock. An old owner must not be
able to delete somebody else's lock.

[atomic.ts](atomic.ts) delegates to one atomic compare-and-delete operation.
[racy.ts](racy.ts) reads the token and deletes later. Both export the expected
function and have the same test, so Konsistent accepts both.

The [fake store](store.ts) makes the race repeatable without timers:

1. Owner A starts releasing its lock.
2. The split implementation reads A's token.
3. Before the read returns, the store lets B take over the lock.
4. A deletes the lock based on the old token it read.
5. The test catches B's missing lock.

The good version compares and deletes in one operation, leaving no gap for B
to take over. The tests also check an ordinary release and a stale token.

[ownership.test.ts](ownership.test.ts) executes both variants through the same
interface. Jev gets the store code too, so it can see what the helper does.

This test uses the fake store, not Redis. It demonstrates the ownership rule
behind Chat SDK's
[atomic Redis release](https://github.com/vercel/chat/blob/main/packages/state-redis/src/index.ts).
