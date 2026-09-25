---
name: konsitent-jev
description: Set up or use the Konsistent convention pack with Jev semantic reviews for TypeScript code rules. Use when a project needs both structural checks and bounded behavioral judgments; use a single checker when one is sufficient.
---

# Konsistent + Jev

Use the smallest check that can decide the requirement. Konsistent checks file paths, declarations, imports, exports, and adjacent files deterministically. Jev judges a bounded behavioral claim against supplied source when syntax alone cannot decide it. Neither substitutes for running the relevant behavior test.

## Route the request

- For file or symbol shape, read [Konsistent structure](../konsistent-structure/SKILL.md) if installed. Use `konsistent validate` and `konsistent check`. Do not send mechanically decidable questions to Jev.
- For a requirement such as “retries reuse the original key” or “the outbox write rolls back with the transaction,” read [Jev behavior](../jev-behavior/SKILL.md) if installed. First identify target source, supporting context, a realistic failure case, and what runtime evidence can prove.
- For combined use, configure `konsistent.json` with the package's `jev/...` convention names and `konsitent-jev.json` with explicit `files`, `targetFiles`, and optional `contextFiles`. Run `pnpm exec konsitent-jev check --dry-run`, then `pnpm exec konsitent-jev check` if live review is wanted and `TYPESAFE_API_KEY` is available.

The package exports a Konsistent JSON convention pack and a separate companion CLI. Jev is not an executable predicate inside Konsistent. Structural failure stops review; a Jev `supported` answer is advisory and does not prove runtime correctness. The CLI's `--strict` option is an explicit user choice; known correct code was falsely contradicted in the [recorded outbox example](https://github.com/juanbermudez/konsitent-jev/blob/main/docs/results.md).

Do not ask Jev to decide whether a file exists, an import is present, an export has the declared name, or a test command passed. Avoid Jev when the required context cannot be supplied within the project's data-sharing rules, or when model uncertainty would make an automated gate inappropriate. For chronology, use the [recorded history example](https://github.com/juanbermudez/konsitent-jev/blob/main/docs/chronology.md); file timestamps or a final diff do not prove tests were written before implementation.

Use the [README](https://github.com/juanbermudez/konsitent-jev#readme) for install and configuration examples. Before changing Konsistent syntax or TypeSafe API calls, read the installed Konsistent schema/docs and [current TypeSafe documentation](https://docs.typesafe.ai/llms.txt). Keep credentials in the process environment; never put values in config or the skill.
