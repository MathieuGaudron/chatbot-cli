import { history } from './history';
import { getProvider } from './providers';

export async function compressHistory(): Promise<void> {
  const provider = getProvider();
  const beforeCount = history.length - 1;
  const conversation = history
    .slice(1)
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n');

  const res = await fetch(provider.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${provider.key}`,
    },
    body: JSON.stringify({
      model: provider.model,
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content:
            'Résume la conversation suivante en 3 à 5 phrases concises, en gardant les infos clés (prénoms, préférences, sujets abordés).',
        },
        { role: 'user', content: conversation },
      ],
    }),
  });

  if (!res.ok) throw new Error(`Compression ${res.status}`);
  const data = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  const summary = data.choices[0].message.content;

  history.splice(1, history.length - 1, {
    role: 'system',
    content: `Résumé : ${summary}`,
  });

  console.log(`\nContexte compressé (${beforeCount} messages → 1 résumé)`);
}
