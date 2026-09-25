# A settings type does not mean settings are honored

Requirement: a caller-supplied base URL and fetch function must be used by
`generate`; preserve the prompt in the JSON body and normalize the trailing slash.

Both [honors-settings.ts](honors-settings.ts) and
[discards-settings.ts](discards-settings.ts) export the expected factory and types.
Konsistent accepts both signatures.

[settings.test.ts](settings.test.ts) calls the real factory and its `generate`
method. The supplied fetch captures the request; the default fetch throws if
called. Assertions check the endpoint, HTTP method, request body, and response.

The honoring variant passes. The discarding variant throws `Unexpected default
transport`. No request can escape to the network through the default transport.

Jev reviews whether settings reach the operation that actually sends the request.
This is a function-level contract test with a controlled transport, not a live
provider API test. It follows the structural pattern of AI SDK provider settings,
with requirements authored for this example.
