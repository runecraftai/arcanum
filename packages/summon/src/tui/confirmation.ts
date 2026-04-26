import * as clack from '@clack/prompts';

interface ConfirmationSummary {
  agents: string[];
  skills: string[];
  action: string;
  method?: string;
  scope?: string;
}

export async function showConfirmation(summary: ConfirmationSummary): Promise<'confirm' | 'back' | 'cancel' | symbol> {
  const lines: string[] = [
    `Action:  ${summary.action}`,
    `Agents:  ${summary.agents.join(', ')}`,
    `Skills:  ${summary.skills.join(', ')}`,
  ];
  if (summary.method) lines.push(`Method:  ${summary.method}`);
  if (summary.scope) lines.push(`Scope:   ${summary.scope}`);

  clack.note(lines.join('\n'), `Ready to ${summary.action}`);

  const result = await clack.confirm({
    message: `Proceed with ${summary.action}?`,
  });

  if (clack.isCancel(result)) {
    return 'back';
  }
  if (!result) {
    return 'cancel';
  }

  return 'confirm';
}
