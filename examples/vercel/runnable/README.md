# Try the examples

These three examples each have a good and broken version. Both look right to
Konsistent because the required files and exports are there. Running the tests
shows what actually happens. From the repo root:

```sh
pnpm examples:vercel
# Optional live semantic review; requires TYPESAFE_API_KEY:
pnpm examples:vercel --jev
```

The runner puts each version and its test in a temporary project, runs
Konsistent, and then runs the Node test. A broken version should fail its test
for the expected reason. It calls Jev only when you add `--jev`.

| Example | What Konsistent sees | What running it shows |
| --- | --- | --- |
| [Meaningful tests](meaningful-tests/README.md) | The parser and importing test exist | A weak test stays green after validation is removed |
| [Lock ownership](lock-ownership/README.md) | The release function and test exist | An old owner deletes a new owner's lock |
| [Provider settings](provider-settings/README.md) | The factory has the expected shape | The request ignores the caller's URL or fetch function |

Jev sees the source and the requirement, but not which version is supposed to
pass or what the test found. Its answer is saved separately from the test output
under
`artifacts/vercel-examples/`.

The patterns are adapted from Vercel's
[adjacent-test conventions](https://github.com/vercel-labs/konsistent/blob/main/konsistent.json),
[Chat state-adapter conventions](https://github.com/vercel/chat/blob/main/.github/konsistent.json),
and [AI SDK provider conventions](https://github.com/vercel/ai/blob/main/.github/konsistent.json).
We wrote these examples to explore the patterns; they are not bug reports about
Vercel's projects.

## Verified result

All six versions passed Konsistent. The tests behaved as expected in all six,
and Jev gave the expected answer for all six in one live run with `jev-1.13.0`.
The strong parser test caught the removed validation; the weak one missed it.
This small set does not predict how often Jev will be right on new code.
[Full results](../../../docs/results.md).
