import { history } from './history';
import { streamCompletion } from './chat';

export async function translateLast(targetLanguage: string): Promise<string> {
  const lastAssistant = [...history]
    .reverse()
    .find((m) => m.role === 'assistant');
  if (!lastAssistant) {
    throw new Error('Aucun message assistant à traduire');
  }

  return streamCompletion(
    [
      {
        role: 'system',
        content: `Traduis le texte suivant en ${targetLanguage}. Renvoie uniquement la traduction, sans commentaire ni explication.`,
      },
      { role: 'user', content: lastAssistant.content },
    ],
    { temperature: 0.1 },
  );
}
