# An imported test can still miss the bug

Requirement: preserve payment ID and integer amount, and reject malformed events,
empty IDs, negative amounts, and fractional cents.

Compare [meaningful.test.ts](meaningful.test.ts) with
[superficial.test.ts](superficial.test.ts). Both import the parser and pass the
structural rule. Both also pass against [parser.ts](parser.ts).

The runner then substitutes [invalid-parser.ts](invalid-parser.ts), which removes
validation. The meaningful test fails with a missing expected exception; the
superficial test still passes because the exported function continues to exist.

Jev's question: do these assertions establish the required behavior? The model
receives the original parser and selected test, not the mutation or its result.
This directly illustrates the post's warning about tests that do not establish
behavior. It does not claim every useful test needs this particular input set.
