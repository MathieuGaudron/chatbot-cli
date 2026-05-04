import 'dotenv/config';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const MISTRAL_URL = 'https://api.mistral.ai/v1/chat/completions';
const MISTRAL_MODEL = 'mistral-small-latest';

async function askMistral(userMessage: string): Promise<string> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error('MISTRAL_API_KEY manquant dans .env');
  }

  const res = await fetch(MISTRAL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MISTRAL_MODEL,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Mistral ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  return data.choices[0].message.content;
}

async function main(): Promise<void> {
  const rl = readline.createInterface({ input, output });

  console.log('Chatbot CLI — Phase 1. (Ctrl+C pour quitter)\n');

  while (true) {
    const userMessage = (await rl.question('Vous : ')).trim();
    if (!userMessage) continue;

    try {
      const reply = await askMistral(userMessage);
      console.log(`IA : ${reply}\n`);
    } catch (err) {
      console.error(`Erreur : ${(err as Error).message}\n`);
    }
  }
}

main();
