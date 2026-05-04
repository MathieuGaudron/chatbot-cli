import { history } from './history';
import { streamCompletion } from './chat';

export async function resumeConversation(): Promise<string> {
  const conversation = history
    .slice(1)
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n');

  return streamCompletion(
    [
      {
        role: 'system',
        content:
          "Résume la conversation en 5 bullet points maximum. Chaque bullet commence par un verbe au participe passé (ex: 'Discuté de...', 'Comparé...', 'Expliqué...'). Format strict, une ligne par bullet :\n- Verbe ...\n- Verbe ...",
      },
      { role: 'user', content: conversation },
    ],
    { temperature: 0.3 },
  );
}
