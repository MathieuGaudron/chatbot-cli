import 'dotenv/config';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const MISTRAL_URL = 'https://api.mistral.ai/v1/chat/completions';
const MISTRAL_MODEL = 'mistral-small-latest';

type Message = { role: 'system' | 'user' | 'assistant'; content: string };

const history: Array<Message> = [
  {
    role: 'system',
    content:
      'Tu es un assistant francophone, concis et utile. Tu te souviens du contexte de la conversation.',
  },
];

async function chatStream(userMessage: string): Promise<string> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error('MISTRAL_API_KEY manquant dans .env');

  history.push({ role: 'user', content: userMessage });

  const res = await fetch(MISTRAL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MISTRAL_MODEL,
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

function printHistory(): void {
  console.log('\n--- history ---');
  history.forEach((m, i) => {
    console.log(`[${i}] ${m.role}: ${m.content}`);
  });
  console.log(`--- ${history.length} messages ---\n`);
}

async function main(): Promise<void> {
  const rl = readline.createInterface({ input, output });

  console.log('Chatbot CLI — Phase 3. (/history pour inspecter, Ctrl+C pour quitter)\n');

  while (true) {
    const userMessage = (await rl.question('Vous : ')).trim();
    if (!userMessage) continue;

    if (userMessage === '/history') {
      printHistory();
      continue;
    }

    try {
      process.stdout.write('IA : ');
      await chatStream(userMessage);
      process.stdout.write('\n\n');
    } catch (err) {
      console.error(`Erreur : ${(err as Error).message}\n`);
    }
  }
}

main();
