# A test can import the code and still miss the bug

The parser should keep the payment ID and integer amount, and reject malformed
events, empty IDs, negative amounts, and fractional cents.

Compare [meaningful.test.ts](meaningful.test.ts) with
[superficial.test.ts](superficial.test.ts). Both import the parser, satisfy
Konsistent, and pass against the original [parser.ts](parser.ts).

Then the runner swaps in [invalid-parser.ts](invalid-parser.ts), which skips
validation. The strong test fails because bad input no longer throws. The weak
test still passes because it only checks that the function exists.

Jev reviews the original parser and one test at a time, asking whether that test
really checks the stated behavior. It does not see the swapped parser or the test
result. This is one concrete version of the original post's warning about tests
that pass without checking the behavior that matters.
