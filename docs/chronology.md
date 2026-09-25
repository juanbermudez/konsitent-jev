# Recorded edit order and semantic review

The ledger establishes observed order. Jev separately judges whether the earlier
files meaningfully address the requested change. Neither file timestamps nor a
model's confidence are treated as proof of chronology.

## Try it on a task

Use a separate checkout for each recorded task. Copy
[the task descriptor](../examples/history/task.json), replace its requirement and
explicit file lists, then start **before** editing:

```sh
pnpm history start examples/history/task.json
```

The descriptor names the exact implementation, test, and plan files to observe.
Missing files are allowed at the start. Baseline files have unknown creation order.
This example opts into both test-before-implementation and plan-before-implementation;
apply that policy to the tasks where your team requires it. It is stricter than a
rule covering only unit tests.

Load/trust the updated project hook settings in the coding agent. PreToolUse takes
snapshots; PostToolUse records the completed edit. A snapshot contains file contents
and hashes. Recording is off until `history start` succeeds. Only the explicitly
listed paths are captured; avoid listing files containing credentials.

```sh
pnpm history check
# With TYPESAFE_API_KEY in the process environment:
pnpm history check --jev
```

For optional live semantic feedback after the first implementation edit, give the
agent process `JEV_HISTORY_REVIEW=1` and `TYPESAFE_API_KEY`. This sends the task
requirement, earlier tests and plans, and implementation before/after contents to
TypeSafe. Without that opt-in, hooks only record and assess order locally.

## Interpret the results

| Result | Meaning |
| --- | --- |
| `order_observed` | Nonempty test and plan edits preceded the first observed implementation edit |
| `order_violation` | Required earlier edits were not observed, with absent baseline prerequisites; same-edit additions do not establish order |
| `insufficient_evidence` | Recording is missing, incomplete, overlapping, or inconsistent; baseline provenance may be unknown |

`order_observed` alone does not establish meaningful preparation. Jev returns
separate `test` and `plan` choices: `relevant`, `inadequate`, or
`insufficient_evidence`, along with probabilities and confidence. No automatic
confidence threshold or semantic blocking is enabled. The CLI's success code is
not an approval of semantic quality: read the choices.

The review uses the snapshot immediately before the first implementation edit.
Creating better tests afterward cannot retroactively satisfy that order. Later
implementation changes need a new scoped task in a separate checkout; this is not
a per-function chronology analyzer.

## Evidence and failure handling

`artifacts/history/events.jsonl` is append-only through this recorder, with
sequence numbers, chained hashes, before/after snapshots, and tool-call IDs.
`review-<ledger-head>.json` saves the exact Jev request and response. A directory
lock serializes writes; an interrupted lock requires inspection rather than an
automatic overwrite. The recorder never resets a task silently.

Snapshots detect unobserved net changes between hooks. An edit followed by an
unobserved exact revert cannot be detected. A missing pre/post pair or overlapping
tool calls yields insufficient evidence. Paths outside the descriptor are outside
scope. A person able to rewrite the entire ledger can forge its hash chain; this
is local consistency evidence, not a signed audit log.

Hook errors return advisory feedback; they do not block or undo edits. Missing
credentials are never interpreted as semantic approval. A 15-second network timeout
bounds optional review, and the ledger/head is checked again before saving it.

## Validation

- `pnpm test:history`: nine temporary-project CLI cases, including order, same-patch
  ambiguity, gaps, incomplete hooks, placeholders, and tampered ledger detection.
- `pnpm jev:review`: seven payment-webhook contexts, with two decisions each. The
  live run matched all seven expected pairs using `jev-1.13.0`.
- Combined integration: simulated Pre/Post events recorded real temporary file
  edits; the Post hook made a live Jev request and returned `test: relevant` and
  `plan: relevant`. This was not a native Codex hook session.

The payment webhook snippets are review fixtures, not an implemented payment
service. No payment, PostgreSQL, or webhook execution proof is claimed. The separate
checkout example still provides runnable CLI E2E tests.

This small labeled development set does not establish general accuracy. A validation
summary is in [results.md](results.md); raw reports are generated locally.

## Upstream patterns

Following [Konsistent's own conventions](https://github.com/vercel-labs/konsistent/blob/main/konsistent.json)
and [fixture-testing guidance](https://github.com/vercel-labs/konsistent/blob/main/AGENTS.md),
this implementation separates reusable checks (`history/`), thin CLI entrypoints
(`scripts/`), and explicit fixture data (`examples/`). The ledger and Jev integration
are our additions, not upstream Vercel components. No new framework dependency
is required.
