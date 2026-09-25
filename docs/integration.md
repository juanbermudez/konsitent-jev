# Integration and advanced Jev patterns

## Extension mechanism

Konsistent's documented extension point is a reusable-convention package with
`exports["./konsistent"]` pointing to JSON. This package follows that format and
ships `module-has-test`, `test-imports-module`, `provider-factory`, and
`module-export`. Consumers bind paths and placeholders via `conventionSources`
and `use`. There is no custom Jev predicate installed into Konsistent's engine.

The `konsitent-jev` executable runs the installed Konsistent first, then semantic
rules from `konsitent-jev.json`. The executable and JSON pack ship together, so
adoption needs one dependency. Files are limited to 128 KiB each, 30 paths per
list, and 256 KiB total review context. Outside-project paths and escaping symlinks
are rejected. File changes during review invalidate the result.

## Patterns drawn from the docs

1. [Parallel questions](https://docs.typesafe.ai/patterns/fan-out): ask for a contract
   verdict and the most relevant source file together. Each question is independent;
   evidence-file selection is navigation help, not independent corroboration.
2. [Evidence verification](https://docs.typesafe.ai/cookbooks/citation_check): keep
   mechanical checks in code, then ask a narrow question about meaning. Our source
   choices are constrained to actual supplied files. This implementation does not
   generate or verify line-level quotations.
3. [Cascades](https://docs.typesafe.ai/cookbooks/sde_cascade): escalate when evidence
   is insufficient. This package's adaptation adds explicitly configured helper
   source for one second-stage Jev request. `targetFiles` separates review targets from test
   and helper context. It does not invoke a reasoning model.
4. [Confidence guidance](https://docs.typesafe.ai/confidence): retain the probability
   distribution. No uncalibrated confidence threshold auto-approves an edit.

Further useful directions include API/documentation consistency, whether an
existing behavior test covers a reported bug, and selection of relevant contracts
from a bounded candidate list. These are opportunities, not implemented guarantees.

## Results and errors

Advisory mode emits semantic findings but exits successfully. Structural failures
exit 1; configuration, missing credentials, API, or malformed-response failures exit
2. `--strict` additionally exits 1 for a contradiction and 2 for insufficient
semantic evidence. `--dry-run` validates listed paths but does not call a model.
Hook mode always returns advisory PostToolUse feedback, including errors; it does
not block edits. It requires the host to run the command from the project root.

The reviewer cannot establish behavior of files it has not seen. A model may be
wrong or overconfident; source assertions and comments can also mislead it. Runtime
examples give a separate behavioral check for the demonstrated failure modes.

## Scope of executable examples

The advanced examples use a simulated committed payment followed by a lost response,
a shared in-memory cache, and an explicit staged-transaction model. Their paired
implementations have the same structural shape. The context cases start with a
wrapper and reveal an initially withheld helper only when the model asks for more
evidence. They reuse the tenant-isolation runtime assertion.

None of these fixtures proves production payment, database, or tenant security.
The model sees the supplied source and requirement, never the expected label or
runtime verdict. Reports are written locally under `artifacts/advanced/`.

Upstream references: [reusable conventions](https://github.com/vercel-labs/konsistent/blob/main/docs/reference/reusable-conventions.md)
and [authoring guide](https://github.com/vercel-labs/konsistent/blob/main/docs/guides/authoring-reusable-conventions.md).
