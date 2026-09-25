# A factory can accept settings and then ignore them

When a caller gives the factory a base URL and a fetch function, `generate`
should use both. It should also keep the prompt in the JSON body and avoid a
double slash in the URL.

Both [honors-settings.ts](honors-settings.ts) and
[discards-settings.ts](discards-settings.ts) export the expected factory and types.
Konsistent accepts both.

[settings.test.ts](settings.test.ts) calls the factory and then `generate`. The
supplied fetch records the request; the default fetch throws if the code uses
it. The test checks the URL, method, body, and response.

The good version passes. The broken one throws `Unexpected default transport`.
The test never makes a real network request.

Jev checks whether the caller's settings make it to the request. This example
borrows the shape of AI SDK provider settings, but the requirement and fake
transport are ours.
