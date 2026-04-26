import * as clack from '@clack/prompts';

export async function selectScope(): Promise<'local' | 'global' | symbol> {
  clack.note('↑↓ navigate   Enter confirm   Esc back', 'Keys');

  return clack.select({
    message: 'Choose installation scope:',
    options: [
      { value: 'local', label: 'Local', hint: 'this project only' },
      { value: 'global', label: 'Global', hint: 'available everywhere' },
    ],
    initialValue: 'local',
  }) as Promise<'local' | 'global' | symbol>;
}
