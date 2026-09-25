# Review with additional helper context

The first request contains only a wrapper that delegates cache lookup. The helper
implementation is withheld. Jev should return `insufficient_evidence`, which causes
one additional request with the explicitly configured helper file.

A tenant-aware helper should then be supported; the helper that omits tenant identity
should be contradicted. The runtime assertion independently exercises isolation.
In the recorded live run both cases used two stages and matched the labels.

This adapts the escalation pattern from Jev's cascade cookbook; it does not
arbitrarily search the filesystem or invoke another reasoning model.
