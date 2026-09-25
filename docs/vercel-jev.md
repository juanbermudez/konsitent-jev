# Where Jev adds to Vercel's Konsistent examples

Research and live evaluation: 2026-09-25. **All ten authored fixtures passed the
adapted Konsistent checks. Jev matched all ten expected semantic judgments.**
This is a small labeled development set, not a general accuracy benchmark.

## The upstream patterns

| Upstream example | Structural guarantee | Additional question for Jev |
| --- | --- | --- |
| [Konsistent's own test-coverage conventions](https://github.com/vercel-labs/konsistent/blob/main/konsistent.json) | Source module has an adjacent test importing it | Do the assertions check the specified behavior, or only that a function exists? |
| [Chat SDK state-adapter conventions](https://github.com/vercel/chat/blob/main/.github/konsistent.json) | Adapter exports its class, factory, options and declared interface | Does the visible lock-release method preserve ownership under concurrency? |
| [AI SDK provider conventions](https://github.com/vercel/ai/blob/main/.github/konsistent.json) | Provider factories, settings and exports have expected structure | Does the factory actually use the caller's settings in downstream requests? |

The lock requirement is grounded in Chat SDK's
[StateAdapter contract](https://github.com/vercel/chat/blob/main/packages/chat/src/types.ts)
and [Redis implementation](https://github.com/vercel/chat/blob/main/packages/state-redis/src/index.ts).
The current Redis implementation compares the token and deletes through an atomic
Lua operation. Our broken examples deliberately depart from that pattern.

For the provider example, we set a simple requirement: use the caller's URL and
fetch function. The factory has the right signature in both versions, but one
throws those settings away. This is our example, not a reported AI SDK bug.

## What we tested

| Case | Konsistent | Jev | Intended |
| --- | --- | --- | --- |
| Parser tests assert parsed values and invalid-input failures | Pass | supported | supported |
| Test imports parser but asserts only that it is a function | Pass | contradicted | contradicted |
| Parser test delegates to unavailable harness | Pass | insufficient_evidence | insufficient_evidence |
| Lock release atomically compares token and deletes | Pass | supported | supported |
| Lock release unconditionally deletes | Pass | contradicted | contradicted |
| Lock release checks token, then separately deletes | Pass | contradicted | contradicted |
| Lock release delegates to undocumented helper | Pass | insufficient_evidence | insufficient_evidence |
| Provider passes caller's URL and fetch to request path | Pass | supported | supported |
| Correct factory signature silently discards settings | Pass | contradicted | contradicted |
| Provider delegates to unavailable builder | Pass | insufficient_evidence | insufficient_evidence |

The subtle lock case matters because another owner can acquire the lock after the
old token is read but before deletion. Required names, imports, and interface
claims do not establish atomicity. Jev identified the contradiction from the
method and the supplied Redis operation semantics.

## How the experiment works

Each entry in [cases.json](../examples/vercel/cases.json) includes its source link,
adapted Konsistent configuration, fixture files, explicit behavioral requirement,
context, and a local expected label. The command materializes the files in a
temporary directory and runs the installed Konsistent CLI against them. Only after
that succeeds does it call Jev.

Jev receives the requirement, source contents and helper context. It does not receive
the expected label, case ID, or upstream source link. The three allowed outputs
are `supported`, `contradicted`, and `insufficient_evidence`. Returned model:
`jev-1.13.0`. A [validation summary](results.md) is included. Full requests, probabilities,
confidence, usage, and timing are generated locally under `artifacts/vercel-jev/`.

```sh
pnpm jev:vercel --dry-run
# With TYPESAFE_API_KEY available:
pnpm jev:vercel
```

## Practical integration

Keep filenames, imports, exports, and type shapes in Konsistent. Add a narrowly
scoped Jev question when the rule's intent depends on behavior: atomic operations,
settings propagation, meaningful assertions, or missing helper context. Return
contradictions as advisory review feedback and retrieve missing context before
judging opaque helpers. Runtime or integration tests should establish the behavior.

No automatic edit blocking was added. No Vercel repository was modified. These
fixtures are illustrative excerpts, not full typechecked SDK adapters. The command
executes Konsistent and live Jev, not Redis, Vitest, or provider requests. A supported
judgment applies only to the stated requirement and supplied code. Several checks
may also be implementable with deterministic data-flow analysis; Jev's value here
is interpreting the contract across different code shapes, not proving correctness.
