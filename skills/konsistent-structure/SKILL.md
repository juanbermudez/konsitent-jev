---
name: konsistent-structure
description: Configure or run Konsistent for deterministic TypeScript file, path, import, export, and declaration conventions. Use for structural rules and their violations, without semantic model review.
---

# Konsistent structure

Inspect the existing TypeScript cohort and installed `node_modules/konsistent/konsistent.schema.json` and relevant docs before authoring `konsistent.json`. Encode a real convention with the appropriate path template and predicate. The installed schema is authoritative for the pinned version.

This package exports `module-has-test`, `test-imports-module`, `provider-factory`, and `module-export` through `conventionSources`. Use a rule only when its structural guarantee is actually desired. An adjacent test file or matching import does not establish meaningful assertions, E2E coverage, test chronology, or passing runtime behavior.

Run `pnpm exec konsistent validate` to check configuration syntax and `pnpm exec konsistent check` to audit source. If the audit reports violations, decide whether they expose real deviations before changing the rule or code. Do not weaken a rule just to get a clean exit.

For fuller upstream workflows, see Vercel's [configuration skill](https://github.com/vercel-labs/konsistent/tree/main/skills/konsistent-config) and [violation-fixing skill](https://github.com/vercel-labs/konsistent/tree/main/skills/konsistent-fix-violations). The latter's interaction steps are not blanket permission requirements for unrelated tasks; follow the current user's authorization and repository instructions.
