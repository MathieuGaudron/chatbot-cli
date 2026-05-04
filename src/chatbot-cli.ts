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

async function chat(userMessage: string): Promise<string> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error('MISTRAL_API_KEY manquant dans .env');
  }

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
    }),
  });

  if (!res.ok) {
    throw new Error(`Mistral ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  const reply = data.choices[0].message.content;

  history.push({ role: 'assistant', content: reply });
  return reply;
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

  console.log('Chatbot CLI — Phase 2. (/history pour inspecter, Ctrl+C pour quitter)\n');

  while (true) {
    const userMessage = (await rl.question('Vous : ')).trim();
    if (!userMessage) continue;

    if (userMessage === '/history') {
      printHistory();
      continue;
    }

    try {
      const reply = await chat(userMessage);
      console.log(`IA : ${reply}\n`);
    } catch (err) {
      console.error(`Erreur : ${(err as Error).message}\n`);
    }
  }
}

main();
