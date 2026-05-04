export type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export const MAX_HISTORY = 10;

export const history: Array<Message> = [
  {
    role: 'system',
    content:
      'Tu es un assistant francophone, concis et utile. Tu te souviens du contexte de la conversation.',
  },
];

export function printHistory(): void {
  console.log('\n--- history ---');
  history.forEach((m, i) => {
    console.log(`[${i}] ${m.role}: ${m.content}`);
  });
  console.log(`--- ${history.length} messages ---\n`);
}
