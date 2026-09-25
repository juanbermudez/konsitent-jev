# konsitent-jev

Structural conventions with [Konsistent](https://github.com/vercel-labs/konsistent).
Semantic code review with [Jev](https://docs.typesafe.ai). An independent
community integration, not affiliated with or endorsed by Vercel or TypeSafe.

Konsistent checks that the required files, imports, and exports exist. Jev checks
whether the supplied code supports a behavioral requirement—for example, whether
retries preserve an idempotency key or a shared cache isolates tenants.

## Install

Requires Node 22.18+. Install from GitHub; this package is not published on npm.

```sh
pnpm add -D github:juanbermudez/konsitent-jev
# Or: npm install --save-dev github:juanbermudez/konsitent-jev
```

The package includes Konsistent as a dependency. To give Codex or Claude Code
the optional workflow skills, install all three from this repo:

```sh
npx skills add juanbermudez/konsitent-jev --skill konsitent-jev --skill konsistent-structure --skill jev-behavior -a codex -a claude-code
```

The parent skill routes structural work to the Konsistent guide and behavioral
review to the Jev guide. Vercel also publishes its own
[configuration](https://github.com/vercel-labs/konsistent/tree/main/skills/konsistent-config)
and [violation-fixing](https://github.com/vercel-labs/konsistent/tree/main/skills/konsistent-fix-violations)
skills.

## Configure

Load the convention pack in `konsistent.json`:

```json
{
  "version": "v1",
  "conventionSources": { "jev": "konsitent-jev" },
  "conventions": [
    {
      "use": "jev/module-has-test",
      "paths": "src/{module}.ts",
      "excludeFiles": ["**/*.test.ts"]
    }
  ]
}
```

Add semantic rules in `konsitent-jev.json`:

```json
{
  "version": 1,
  "model": "jev-1.13.0",
  "rules": [
    {
      "id": "retry-idempotency",
      "requirement": "Retries after a lost response must reuse the original idempotency key.",
      "files": ["src/charge.ts", "src/charge.test.ts"],
      "targetFiles": ["src/charge.ts"],
      "contextFiles": ["src/payment-client.ts"]
    }
  ]
}
```

`files` are reviewed first; `targetFiles` identifies the implementation under review
(the other files provide context). If omitted, all listed files are targets. If Jev returns `insufficient_evidence`, the configured
`contextFiles` are added for one further review. Paths are explicit and relative
to the project root. Only listed file contents and requirements are sent to TypeSafe.

## Run

Set `TYPESAFE_API_KEY` in your environment, then run:

```sh
pnpm exec konsitent-jev check
```

Konsistent runs first. Jev returns `supported`, `contradicted`, or
`insufficient_evidence`, plus a relevant file, confidence, and repair guidance.
JSON output includes source hashes and the exact model requests and responses.

```sh
pnpm exec konsitent-jev check --dry-run  # Validate without API calls
pnpm exec konsitent-jev check --strict   # Fail on contradiction or uncertainty
```

Semantic results are advisory by default. Structural and setup errors still fail.
Strict mode exits `1` for contradictions and `2` for uncertainty or operational
errors. A supported judgment is not proof of runtime correctness.

The package exports reusable JSON conventions at `./konsistent`. Jev is a companion
CLI, not a custom predicate executed inside upstream Konsistent.

## Examples

| Example | What the behavioral check catches |
| --- | --- |
| [Meaningful tests](examples/vercel/runnable/meaningful-tests) | An existence-only test misses removed validation |
| [Lock ownership](examples/vercel/runnable/lock-ownership) | A split read/delete removes another owner's lock |
| [Provider settings](examples/vercel/runnable/provider-settings) | A factory silently ignores custom settings |
| [Retry idempotency](examples/advanced/retry) | A retry generates a second charge key |
| [Tenant isolation](examples/advanced/tenant-cache) | A cache key omits tenant identity |
| [Transactional outbox](examples/advanced/outbox) | An outbox write escapes transaction rollback |
| [Helper context](examples/advanced/context) | An opaque helper needs a second review with its source |

From a clone:

```sh
pnpm install --frozen-lockfile
pnpm examples:vercel
pnpm examples:advanced
pnpm examples:advanced --jev  # Live Jev; requires TYPESAFE_API_KEY
```

Examples include intentionally flawed variants. A successful demonstration catches
the expected failures. Lock, transaction, payment, and transport models are local;
these runs do not validate live Redis, database, or payment services.

Current advanced evaluation: **7/8** live Jev judgments matched expectations; the
correct outbox example was a false positive. [Results and limitations](docs/results.md).

## Agent hooks

`konsitent-jev hook` accepts a PostToolUse event on stdin and returns advisory
feedback to the agent. In either a trusted project-level `.codex/hooks.json` or
`.claude/settings.json`, add this hook entry under `hooks`:

```json
{
  "PostToolUse": [
    {
      "matcher": "Write|Edit",
      "hooks": [
        {
          "type": "command",
          "command": "cd \"$(git rev-parse --show-toplevel)\" && pnpm exec konsitent-jev hook"
        }
      ]
    }
  ]
}
```

Merge the entry into an existing `hooks` object; do not replace other hooks. The
checked-in `.codex/hooks.json` and `.claude/settings.json` are for developing this
example repo: they invoke its local history and checkout-policy scripts. Consumers
should use the command above. It reviews all configured semantic rules after a
matching edit, sends their listed source to TypeSafe when a key is available, and
does not undo edits. The separate [chronology example](docs/chronology.md) records
before/after snapshots.

## Development

```sh
pnpm verify
pnpm test:history
pnpm examples:vercel
pnpm examples:advanced
pnpm test:package
```

[Integration details and Jev patterns](docs/integration.md). Model results are
probabilistic; missing evidence remains explicit. No accuracy claim extends beyond
the recorded examples.

## Credits and license

This project's original code and skills are [MIT licensed](LICENSE).
[Konsistent](https://github.com/vercel-labs/konsistent) is a Vercel project
licensed separately under [Apache-2.0](https://github.com/vercel-labs/konsistent/blob/main/LICENSE)
and is installed as a dependency. Jev is a TypeSafe service; using it requires
a TypeSafe API key. The names Konsistent, Vercel, TypeSafe, and Jev belong to
their respective owners.
