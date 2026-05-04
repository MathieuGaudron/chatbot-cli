export type Provider = { url: string; key: string; model: string };

export const PROVIDERS: Record<string, Provider> = {
  mistral: {
    url: 'https://api.mistral.ai/v1/chat/completions',
    key: process.env.MISTRAL_API_KEY ?? '',
    model: 'mistral-small-latest',
  },
  groq: {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    key: process.env.GROQ_API_KEY ?? '',
    model: 'llama-3.3-70b-versatile',
  },
};

let current: Provider = PROVIDERS.mistral;

export function getProvider(): Provider {
  return current;
}

export function switchProvider(name: string): boolean {
  const provider = PROVIDERS[name];
  if (!provider) return false;
  current = provider;
  return true;
}
