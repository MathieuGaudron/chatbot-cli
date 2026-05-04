import 'dotenv/config';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

type Message = { role: 'system' | 'user' | 'assistant'; content: string };

const PROVIDERS: Record<string, { url: string; key: string; model: string }> = {
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

let currentProvider = PROVIDERS.mistral;

function switchProvider(name: string): boolean {
  const provider = PROVIDERS[name];
  if (!provider) return false;
  currentProvider = provider;
  return true;
}

const history: Array<Message> = [
  {
    role: 'system',
    content:
      'Tu es un assistant francophone, concis et utile. Tu te souviens du contexte de la conversation.',
  },
];

async function chatStream(userMessage: string): Promise<string> {
  if (!currentProvider.key) {
    throw new Error('Clé API manquante pour le provider courant');
  }

  history.push({ role: 'user', content: userMessage });

  const res = await fetch(currentProvider.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${currentProvider.key}`,
    },
    body: JSON.stringify({
      model: currentProvider.model,
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

  console.log(
    'Chatbot CLI — Phase 4. (/history, /provider <name>, Ctrl+C pour quitter)\n',
  );

  while (true) {
    const userMessage = (await rl.question('Vous : ')).trim();
    if (!userMessage) continue;

    if (userMessage === '/history') {
      printHistory();
      continue;
    }

    if (userMessage.startsWith('/provider ')) {
      const name = userMessage.slice('/provider '.length).trim();
      if (switchProvider(name)) {
        console.log(`Provider changé : ${name} (${currentProvider.model})\n`);
      } else {
        console.log(
          `Provider inconnu : ${name}. Disponibles : ${Object.keys(PROVIDERS).join(', ')}\n`,
        );
      }
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
