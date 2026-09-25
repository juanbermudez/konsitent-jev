# Tenant-aware caching

Two tenants request the same invoice ID. The correct implementation includes both
tenant and invoice in its cache key; the flawed implementation uses only the ID.
The test verifies different tenants receive their own data while repeat requests
within one tenant reuse the cached value.

Both variants pass structural conventions. Runtime assertions expose the leaking
key, and Jev reviews whether identity flows into the cache lookup. This checks a
local Map-based example, not production tenant security.

Run `pnpm examples:advanced` from the root.
