# Keep each tenant's cache separate

Two tenants ask for an invoice with the same ID. The good version puts both the
tenant and invoice ID in the cache key. The broken version uses only the invoice
ID, so one tenant can get the other's cached value. The test checks that each
tenant gets its own invoice and that repeat requests still use the cache.

Both versions pass Konsistent's structure checks. The test catches the bad key;
Jev reviews whether the tenant ID makes it into the lookup. This uses an
in-memory `Map`, so it does not establish security in a deployed app.

Run `pnpm examples:advanced` from the root.
