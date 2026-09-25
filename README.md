# konsitent-jev

Use [Konsistent](https://github.com/vercel-labs/konsistent) when you can spell out
the rule in code, like which files, imports, or exports should exist. Use
[Jev](https://docs.typesafe.ai) when those checks are not enough, like deciding
whether retries reuse a payment key or a cache keeps tenants separate.

## Install

Requires Node 22.18+. Install from GitHub. There is no npm release yet.

```sh
pnpm add -D github:juanbermudez/konsitent-jev
# Or: npm install --save-dev github:juanbermudez/konsitent-jev
```

Konsistent comes with the package. If you want Codex or Claude Code to help set
up and use the checks, install the three optional skills too:

```sh
npx skills add juanbermudez/konsitent-jev --skill konsitent-jev --skill konsistent-structure --skill jev-behavior -a codex -a claude-code
```

The main skill points agents to the structural or Jev guide as needed. Vercel
also publishes its own
[configuration](https://github.com/vercel-labs/konsistent/tree/main/skills/konsistent-config)
and [violation-fixing](https://github.com/vercel-labs/konsistent/tree/main/skills/konsistent-fix-violations)
skills.

## Configure

Tell Konsistent which structure to check in `konsistent.json`:

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

Put the behavior you want Jev to review in `konsitent-jev.json`:

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

Jev reads `files` first. `targetFiles` says which ones contain the code being
judged; the rest can provide context, such as tests. If Jev needs more information,
it gets one more look with the listed `contextFiles`. All paths are relative to
the project root. The requirement and listed file contents are sent to TypeSafe.

## Run

Set `TYPESAFE_API_KEY` in your environment and run:

```sh
pnpm exec konsitent-jev check
```

Konsistent runs first. Jev then says `supported`, `contradicted`, or
`insufficient_evidence`. The JSON report includes the file it focused on,
confidence, guidance, source hashes, and the request and response.

```sh
pnpm exec konsitent-jev check --dry-run  # Validate without API calls
pnpm exec konsitent-jev check --strict   # Fail on contradiction or uncertainty
```

Jev findings are advice by default. A failed Konsistent check or setup error
still exits with an error. With `--strict`, a contradiction exits `1`; missing
evidence or an operational error exits `2`. Even a `supported` result is a code
review judgment, so run the behavior test as well.

The package includes a reusable Konsistent convention pack and a separate Jev
command. Konsistent itself does not call Jev.

## Examples

| Example | What goes wrong in the broken version |
| --- | --- |
| [Meaningful tests](examples/vercel/runnable/meaningful-tests) | The test still passes after validation is removed |
| [Lock ownership](examples/vercel/runnable/lock-ownership) | An old owner deletes the new owner's lock |
| [Provider settings](examples/vercel/runnable/provider-settings) | The factory ignores the URL and fetch function it was given |
| [Retry idempotency](examples/advanced/retry) | A retry uses a new payment key and creates a second charge |
| [Tenant isolation](examples/advanced/tenant-cache) | Two tenants share the same cached invoice |
| [Transactional outbox](examples/advanced/outbox) | The outbox write survives a failed transaction |
| [Helper context](examples/advanced/context) | Jev needs to see the helper before it can judge the wrapper |

From a clone:

```sh
pnpm install --frozen-lockfile
pnpm examples:vercel
pnpm examples:advanced
pnpm examples:advanced --jev  # Live Jev; requires TYPESAFE_API_KEY
```

Each example has a good version and a deliberately broken one. The broken tests
should fail for the expected reason. They use small local stand-ins for locks,
transactions, payment responses, and network requests; no real Redis, database,
or payment service is called.

In the latest live run, Jev got **7 of 8** advanced examples right. It flagged
the correct outbox version as broken. [Results and limits](docs/results.md).

## Agent hooks

The hook can give an agent feedback after a file edit. Add this entry under
`hooks` in a trusted project's `.codex/hooks.json` or `.claude/settings.json`:

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

Add this alongside any hooks you already have. The hook files in this repo are
for working on this repo: they also run its history and checkout checks. In your
project, use the command above. After an edit, it reviews every configured Jev
rule and sends the listed source to TypeSafe when a key is available. It gives
feedback; it cannot undo the edit. The [edit-order example](docs/chronology.md)
shows how to record what was changed before and after an implementation edit.

## Development

```sh
pnpm verify
pnpm test:history
pnpm examples:vercel
pnpm examples:advanced
pnpm test:package
```

[How the integration works](docs/integration.md). Jev can be wrong, and these
small examples do not tell us how often it will be right on a new codebase.

## Credits and license

Our code and skills are [MIT licensed](LICENSE). Konsistent is Vercel's project;
it comes as a dependency under its own [Apache-2.0 license](https://github.com/vercel-labs/konsistent/blob/main/LICENSE).
Jev is TypeSafe's service and needs an API key. The names Konsistent, Vercel,
TypeSafe, and Jev belong to their respective owners.
