# Recorded validation

Local validation on 2026-09-25, using Jev `jev-1.13.0`. These are hand-labeled
development examples, not held-out benchmarks or a general accuracy estimate.

| Check | Result | Scope |
| --- | --- | --- |
| Original runnable pairs | 6/6 expected behavioral outcomes and Jev judgments | Meaningful assertions, lock schedule, provider settings |
| New advanced runtime cases | 8/8 expected outcomes | Retry, tenant cache, transaction rollback, helper delegation |
| First advanced Jev run | 6/8 labels matched | False positives on correct retry and correct outbox |
| Revised explicit-target Jev run | 7/8 labels matched | Correct outbox still falsely contradicted |
| Helper-context cases | 2/2 resolved after a second request | Context-correct supported; context-flawed contradicted |
| Package consumer checks | 5/5 passed | Fresh tarball install, exported pack, missing key, escaped paths, structural/hook failure handling |
| Chronology CLI cases | 9/9 passed in prior validation | Recorded order and gaps; not native-host coverage proof |

The first advanced harness classified strict-mode mismatches as errors before
running those cases' runtime checks. The local-only runtime run had already passed
all eight. The revised harness retains model disagreements separately and executes
every runtime case. Neither result was discarded or relabeled as a success.

Adding explicit target files corrected the retry classification in the next run.
A single rerun does not isolate prompt improvement from model variability. The
outbox false positive remains documented and is a reason to use advisory mode.

Local transcripts are generated under `artifacts/`; they are excluded from Git.
No live payment, Redis, or database service was exercised. Only Jev requests were
live network evaluations. GitHub CI runs deterministic examples without API keys.
