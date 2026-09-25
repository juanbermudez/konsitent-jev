export type ProviderSettings = { baseURL?: string; fetch?: typeof fetch };
export type Provider = { generate(prompt: string): Promise<Response> };

export function createProvider(settings: ProviderSettings): Provider {
  return {
    generate(prompt) {
      return globalThis.fetch('https://default.invalid/v1/generate', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
    },
  };
}
