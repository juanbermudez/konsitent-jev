# Jev sometimes needs to see the helper

At first, Jev sees only a function that passes cache lookups to a helper. It
cannot tell from that file whether tenants are kept separate, so it should say
`insufficient_evidence`. The next request includes the helper file named in the
config.

With the helper visible, Jev accepted the version that uses the tenant ID and
rejected the one that leaves it out. The test checks the same behavior by running
both versions. In the recorded live run, Jev needed two requests for each case
and got both right.

This follows Jev's cascade pattern. The tool reads only the helper files named
in the config; it does not go searching through the repo.
