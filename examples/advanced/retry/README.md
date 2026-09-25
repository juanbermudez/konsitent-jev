# A retry should not charge twice

Imagine the payment goes through, but the response gets lost. The caller tries
again. The good version reuses the same payment key, so the second request finds
the first charge. The broken version makes a new key and creates a second charge.

The test uses a small fake payment client. It records the first charge and then
throws, as if the response never arrived. On the retry, the test checks that no
second charge was made. Both versions have the same exported function and test
file, so Konsistent accepts both.

Run `pnpm examples:advanced` from the repo root. Add `--jev` to ask Jev to review
the source too. The fake client makes this failure easy to repeat; the example
does not connect to Stripe or any other payment service.
