# Retry idempotency

A payment can commit even when its response is lost. The caller retries with the
same amount. The correct implementation creates its idempotency key once; the
flawed implementation creates a new key on each attempt.

The executable client model records the first charge, then throws before returning
its response. The second attempt must return the same charge without creating
another. Both variants export the same function and have the required test.

Run `pnpm examples:advanced` from the root, or add `--jev` for live source review.
This is a local protocol model, not a payment-provider integration.
