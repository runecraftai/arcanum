# `/start-work` dispatch flow

## Finding

`/start-work` is handled in the chat policy path, not in the generic command router.

## Relevant pointers

- `packages/guild/src/application/policy/chat-policy.ts:createCommandChatPolicy()`
  - calls `executeStartWorkCommand(...)`
- `packages/guild/src/application/commands/start-work-command.ts:executeStartWorkCommand()`
  - emits `switchAgent: "fighter"` when the parsed builtin command is `start-work`
- `packages/guild/src/application/commands/command-router.ts:routeCommandExecuteBefore()`
  - handles `token-report`, `metrics`, and `guild-health`, but **not** `start-work`
- `packages/guild/src/runtime/opencode/plugin-adapter.ts:handleCommandExecuteBefore()`
  - registers builtin commands, then delegates to `routeCommandExecuteBefore(...)`

## Root cause

If the runtime relies on `command.execute.before` to dispatch `/start-work`, the command router returns no effects, so the Fighter switch never happens there. The Fighter handoff only occurs later in the chat-message policy path.

## Related test coverage

- `packages/guild/src/plugin/plugin-interface.test.ts` covers the `chat.message` path for `/start-work`.
- There is no equivalent `command.execute.before` test for `/start-work`.
