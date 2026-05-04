import { history, MAX_HISTORY, Message } from './history';
import { getProvider } from './providers';
import { compressHistory } from './compress';

export async function streamCompletion(
  messages: Message[],
  opts: { temperature?: number } = {},
): Promise<string> {
  const provider = getProvider();
  if (!provider.key) {
    throw new Error('Clé API manquante pour le provider courant');
  }

  const res = await fetch(provider.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${provider.key}`,
    },
    body: JSON.stringify({
      model: provider.model,
      messages,
      stream: true,
      ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}),
    }),
  });

  if (!res.ok || !res.body) throw new Error(`Mistral ${res.status}`);

  const decoder = new TextDecoder();
  let fullReply = '';

  for await (const chunk of res.body as any) {
    const text = decoder.decode(chunk);
    for (const line of text.split('\n')) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (payload === '[DONE]') continue;
      try {
        const delta = JSON.parse(payload).choices[0]?.delta?.content;
        if (delta) {
          process.stdout.write(delta);
          fullReply += delta;
        }
      } catch {}
    }
  }

  return fullReply;
}

export async function chatStream(userMessage: string): Promise<string> {
  if (history.length > MAX_HISTORY) {
    await compressHistory();
  }

  history.push({ role: 'user', content: userMessage });

  const reply = await streamCompletion(history);

  history.push({ role: 'assistant', content: reply });
  return reply;
}
