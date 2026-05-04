import { history, MAX_HISTORY } from './history';
import { getProvider } from './providers';
import { compressHistory } from './compress';

export async function chatStream(userMessage: string): Promise<string> {
  const provider = getProvider();
  if (!provider.key) {
    throw new Error('Clé API manquante pour le provider courant');
  }

  if (history.length > MAX_HISTORY) {
    await compressHistory();
  }

  history.push({ role: 'user', content: userMessage });

  const res = await fetch(provider.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${provider.key}`,
    },
    body: JSON.stringify({
      model: provider.model,
      messages: history,
      stream: true,
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

  history.push({ role: 'assistant', content: fullReply });
  return fullReply;
}
