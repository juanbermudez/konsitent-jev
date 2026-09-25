# Runnable examples: structure, judgment, behavior

Three paired examples show why a structural pass is useful but incomplete.
Run from the repository root:

```sh
pnpm examples:vercel
# Optional live semantic review; requires TYPESAFE_API_KEY:
pnpm examples:vercel --jev
```

The runner copies each selected variant into a temporary project as
`implementation.ts`, copies its test as `implementation.test.ts`, runs Konsistent,
and then runs the actual Node test process. Deliberately broken examples are
expected to fail; the demonstration succeeds only when those failures occur for
the intended reason. No network calls occur unless `--jev` is supplied.

| Example | Both versions pass Konsistent | What execution demonstrates |
| --- | --- | --- |
| [Meaningful tests](meaningful-tests/README.md) | Test file exists, imports parser; parser exports required function | Strong assertions catch removed validation; existence-only test stays green |
| [Lock ownership](lock-ownership/README.md) | Required release function and importing test exist | Split check/delete loses another owner's lock under a controlled schedule |
| [Provider settings](provider-settings/README.md) | Factory accepts settings and returns expected provider type | A real function call must use the supplied URL and transport |

Jev reviews original source and the requirement, without seeing variant IDs,
expected labels, mutation code, or execution results. Its judgment is saved
separately from runtime evidence. Reports include raw test output under
`artifacts/vercel-examples/`.

The patterns are adapted from Vercel's
[adjacent-test conventions](https://github.com/vercel-labs/konsistent/blob/main/konsistent.json),
[Chat state-adapter conventions](https://github.com/vercel/chat/blob/main/.github/konsistent.json),
and [AI SDK provider conventions](https://github.com/vercel/ai/blob/main/.github/konsistent.json).
These are authored demonstrations, not Vercel defect reports or full SDK adapters.

## Verified result

All six variants passed structural checks. Execution demonstrated the intended
outcomes for all six, and live Jev matched all six expected source judgments
(`jev-1.13.0`). The meaningful test detected the deliberately invalid parser;
the superficial test missed it. These six labeled examples are not a held-out
accuracy benchmark. [Validation summary](../../../docs/results.md).
