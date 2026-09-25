---
name: jev-behavior
description: Add or evaluate bounded Jev semantic code reviews when structural rules cannot decide a behavioral contract. Use for explicit source-backed judgments, uncertainty, and context escalation.
---

# Jev behavior review

State one concrete behavioral requirement and a failure mode. Put only the relevant source in `files`, mark production implementation in `targetFiles`, and add specific helper source to `contextFiles` when an initially opaque call may need a second review. The model receives the requirement and these file contents; keep confidential source out unless sharing it with TypeSafe is authorized.

The companion CLI asks for `supported`, `contradicted`, or `insufficient_evidence`, and constrains the evidence-file choice to supplied paths. It retries with configured context only after `insufficient_evidence`. Evidence-file selection helps navigate source; it is not a verified citation. Preserve uncertainty and probabilities rather than converting a single judgment into proof.

Use Jev for claims such as idempotency across a lost response, tenant isolation across shared cache state, or whether an outbox write uses the same transaction. Do not use it for file existence, import/export shape, exact text, local arithmetic, test execution, or facts a deterministic checker can decide. Run an executable scenario for the relevant failure mode when possible.

Check results against known correct and flawed cases before considering `--strict`. The [recorded evaluation](https://github.com/juanbermudez/konsitent-jev/blob/main/docs/results.md) matched 7 of 8 advanced labels and falsely contradicted correct outbox code. Default advisory mode is appropriate until the project's own cases justify a stronger gate. Read [current TypeSafe docs and cookbooks](https://docs.typesafe.ai/llms.txt) before changing the API, model, or question design.
