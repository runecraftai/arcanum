import { test, expect, beforeEach, afterEach, mock, spyOn } from 'bun:test';
import {
  closeTmuxPane,
  setSpawnAsyncFn,
  resetSpawnAsyncFn,
  resetTmuxPathCache,
} from '../utils/tmux';

// Mock spawnAsync
interface SpawnResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

type MockSpawnFn = (
  command: string[],
  options?: { ignoreOutput?: boolean },
) => Promise<SpawnResult>;

function createMockSpawnFn() {
  const calls: Array<{ command: string[]; options?: { ignoreOutput?: boolean } }> = [];
  const results: SpawnResult[] = [];

  const fn: MockSpawnFn = async (command, options) => {
    calls.push({ command, options });
    const result = results.shift();
    if (!result) {
      // Default success
      return { exitCode: 0, stdout: '', stderr: '' };
    }
    return result;
  };

  return { fn, calls, results };
}

let mockSpawnData: ReturnType<typeof createMockSpawnFn>;

beforeEach(() => {
  resetTmuxPathCache();
  resetSpawnAsyncFn();
  mockSpawnData = createMockSpawnFn();
  setSpawnAsyncFn(mockSpawnData.fn);
});

afterEach(() => {
  resetSpawnAsyncFn();
  mock.restore();
});

test('closeTmuxPane calls kill-pane and applies layout on success', async () => {
  // Setup mocks
  mockSpawnData.results.push(
    { exitCode: 0, stdout: '/usr/bin/tmux\n', stderr: '' }, // find tmux
    { exitCode: 0, stdout: 'tmux 3.3\n', stderr: '' }, // verify tmux
    { exitCode: 0, stdout: '', stderr: '' }, // kill-pane
    { exitCode: 0, stdout: '', stderr: '' }, // applyLayout (select-layout)
  );

  const result = await closeTmuxPane('%1');

  expect(result).toBe(true);

  // Verify tmux flow
  const killPaneCall = mockSpawnData.calls.find(c => c.command.includes('kill-pane'));
  expect(killPaneCall).toBeDefined();
  expect(killPaneCall?.command).toContain('-t');
  expect(killPaneCall?.command).toContain('%1');
});

test('closeTmuxPane returns false when kill-pane fails', async () => {
  mockSpawnData.results.push(
    { exitCode: 0, stdout: '/usr/bin/tmux\n', stderr: '' },
    { exitCode: 0, stdout: 'tmux 3.3\n', stderr: '' },
    { exitCode: 1, stdout: '', stderr: 'pane not found' }, // kill-pane fails
  );

  const result = await closeTmuxPane('%1');

  expect(result).toBe(false);
});

test('closeTmuxPane returns false when no paneId provided', async () => {
  const result = await closeTmuxPane('');

  expect(result).toBe(false);
  // No tmux calls should have been made
  expect(mockSpawnData.calls.length).toBe(0);
});