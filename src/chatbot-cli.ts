import 'dotenv/config';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { PROVIDERS, getProvider, switchProvider } from './providers';
import { printHistory } from './history';
import { chatStream } from './chat';
import { resumeConversation } from './resume';
import { translateLast } from './translate';
import { printSessionMetrics } from './metrics';

async function main(): Promise<void> {
  const rl = readline.createInterface({ input, output });

  console.log(
    'Chatbot CLI. (/history, /provider <name>, /resume, /translate <langue>, /cost, Ctrl+C)\n',
  );

  while (true) {
    const userMessage = (await rl.question('Vous : ')).trim();
    if (!userMessage) continue;

    if (userMessage === '/history') {
      printHistory();
      continue;
    }

    if (userMessage === '/cost') {
      printSessionMetrics();
      continue;
    }

    if (userMessage === '/resume') {
      try {
        process.stdout.write('\nRésumé :\n');
        await resumeConversation();
        process.stdout.write('\n\n');
      } catch (err) {
        console.error(`Erreur : ${(err as Error).message}\n`);
      }
      continue;
    }

    if (userMessage.startsWith('/translate ')) {
      const lang = userMessage.slice('/translate '.length).trim();
      if (!lang) {
        console.log('Usage : /translate <langue>\n');
        continue;
      }
      try {
        process.stdout.write('Traduction : ');
        await translateLast(lang);
        process.stdout.write('\n\n');
      } catch (err) {
        console.error(`Erreur : ${(err as Error).message}\n`);
      }
      continue;
    }

    if (userMessage.startsWith('/provider ')) {
      const name = userMessage.slice('/provider '.length).trim();
      if (switchProvider(name)) {
        console.log(`Provider changé : ${name} (${getProvider().model})\n`);
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
