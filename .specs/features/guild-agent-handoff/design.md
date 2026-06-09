# Design

## Summary
Use a command-driven foreground spawn for Wizard, but treat it as a rich handoff rather than a simple command invocation. Bard prepares the handoff payload, Wizard receives it in a new session, and the user continues interacting with Wizard directly.

## Components

### Bard prompt routing
- Bard asks the user whether planning should be interactive or delegated.
- Bard uses the OpenCode question tool (`ask_user`) for the choice.
- For interactive planning, Bard prepares the handoff payload and triggers Wizard spawn.

### Start-plan command
- `start-plan` acts as the foreground Wizard entrypoint.
- It should accept a structured handoff payload, not just a goal string.

### Wizard foreground session
- Wizard is configured as `mode: "all"`.
- Wizard can use Rogue and Warlock for read-only research.
- Wizard cannot implement code.

### Final handoff
- Wizard ends planning by using the question tool to choose the next step.
- If execution is requested, Wizard hands off to Fighter.

## Notes
- Automatic interception of `call_guild_agent(wizard)` is not the primary path.
- The safe path is explicit interactive handoff through the foreground Wizard entrypoint.
