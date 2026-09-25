export type ProviderSettings = { baseURL?: string; fetch?: typeof fetch };
export type Provider = { generate(prompt: string): Promise<Response> };

export function createProvider(settings: ProviderSettings): Provider {
  const request = settings.fetch ?? globalThis.fetch;
  const baseURL = (settings.baseURL ?? 'https://default.invalid/v1').replace(/\/$/, '');
  return {
    generate(prompt) {
      return request(`${baseURL}/generate`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
    },
  };
}
