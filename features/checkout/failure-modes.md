# Checkout failure modes

This plan describes the demo's public CLI boundary: one JSON request on stdin,
one JSON response on stdout, and an exit status.

| Failure | Expected behavior | Scenario |
| --- | --- | --- |
| Malformed JSON or invalid request shape | Exit 1; `invalid-request` | invalid-request |
| Empty cart or invalid quantity | Exit 1; `invalid-request` | empty-cart, invalid-quantity |
| Unknown SKU | Exit 1; `unknown-sku` | unknown-sku |
| Requested quantity exceeds stock, including duplicate cart lines | Exit 1; `out-of-stock` | duplicate-lines |
| Unknown coupon | Exit 1; `invalid-coupon` | invalid-coupon |
| Multiple items plus a valid coupon | Aggregate quantities and apply a 10% discount in cents | discounted-cart |

Stock is a fixed fixture. Payments, shipping, persistence, and concurrent orders
are outside this small CLI demo. File existence cannot prove this plan was
written before implementation or that it enumerates every possible failure.
