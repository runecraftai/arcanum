import * as clack from '@clack/prompts';

export async function promptGenerateCommands(): Promise<boolean> {
  const result = await clack.confirm({
    message: 'Generate slash commands for installed skills?',
    initialValue: true,
  });
  if (clack.isCancel(result)) return false;
  return result === true;
}
