import { getProvider } from './providers';

export type Usage = {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
};

const PRICING: Record<string, { input: number; output: number }> = {
  'mistral-small-latest': { input: 0.2, output: 0.6 },
  'llama-3.3-70b-versatile': { input: 0.59, output: 0.79 },
};

let totalTokens = 0;
let totalCost = 0;
let totalCalls = 0;

export function recordCall(usage: Usage | null, latencyMs: number): void {
  totalCalls += 1;

  if (!usage) {
    console.log(`\n[latence: ${latencyMs}ms]`);
    return;
  }

  const provider = getProvider();
  const pricing = PRICING[provider.model] ?? { input: 0, output: 0 };
  const cost =
    (usage.prompt_tokens * pricing.input +
      usage.completion_tokens * pricing.output) /
    1_000_000;

  totalTokens += usage.total_tokens;
  totalCost += cost;

  console.log(
    `\n[tokens: ${usage.total_tokens} (in:${usage.prompt_tokens}/out:${usage.completion_tokens}) | latence: ${latencyMs}ms | coût: $${cost.toFixed(6)}]`,
  );
}

export function printSessionMetrics(): void {
  console.log(
    `\nSession : ${totalCalls} appels | ${totalTokens} tokens | $${totalCost.toFixed(4)}\n`,
  );
}
